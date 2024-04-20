Il progetto è nato dalla consultazione di questo link
https://javascript.plainenglish.io/embarking-on-the-ai-adventure-introduction-to-langchain-and-node-js-7393b6364f3a

creazione del package json

```
npm init -y
```

installazione delle librerie basilari per un servizio web express

```
npm i express dotenv
npm i typescript --save-dev
```

si installano le dipendenze in ambiente di sviluppo
```
npm i -D typescript @types/express @types/node
```

```
npm install ts-node
npm install nodemon
```


inizializzazione dell'ambiente typescript

```
npx tsc --init
```

impostazione del tsconfig nel seguente modo

```
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "moduleResolution": "NodeNext",
    "types": ["node"],
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "dist"],
  "ts-node": {
    "transpileOnly": true,
    "files": true,
    "esm": true,
    "experimentalSpecifierResolution": "node"
  }
}
```

il package.json deve essere impostato piu o meno cosi, sopratutto sulla definizione degli script di avvio

```
{
  "name": "chainprompt-ai",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "start": "node --no-warnings=ExperimentalWarning --loader ts-node/esm  src/server.ts ./tsconfig.json",
    "start-dev": "nodemon --exec node --no-warnings=ExperimentalWarning --loader ts-node/esm  src/server.ts ./tsconfig.json",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.11.5",
    "typescript": "^5.3.3"
  },
  "dependencies": {
    "dotenv": "^16.3.2",
    "express": "^4.18.2",
    "nodemon": "^3.0.3",
    "ts-node": "^10.9.2"
  }
}
```

creare il file server.ts

```
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app: express.Express = express();
const port: string | number = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
```

un avvio del server dovrebbe gia permettere un ascolto sulla porta 3000

passaggi successivi:

fornire la configurazione docker compose

il Dockerfile puo avere un template simile al seguente

```
FROM node:20.11.0-alpine3.18

# Upgrade packages
RUN apk --no-cache --update --available upgrade
RUN apk --no-cache add --virtual builds-deps build-base python3
RUN apk add --no-cache make gcc g++
# Changing working dir
WORKDIR /usr/app
ADD package*.json ./
RUN npm install
# Copy app to working dir
COPY . .
```

il docker compose simile al seguente

```
version: "3"
services:
  api:
    build:
      dockerfile: Dockerfile.dev
      context: ./
    volumes:
      - ./:/usr/app
      - /usr/app/node_modules
    env_file:
      - ./.env
    ports:
      - "3000:3000"
    entrypoint: ./entry-point.sh
```

creare un entry-point.ts per la gestione dell'ambiente di sviluppo e produzione

```
#!/bin/sh
if [ $NODE_ENV == "development" ] 
then
    echo "development mode running";
    npm install
    npm run start-dev
else
    npm run start
fi
```

dare i permessi di esecuzione

```
chmod +x entry-point.sh
```


creare un file .env
```
NODE_ENV=development
```


dopo aver consolidato la parte server, tenendo conto degli approcci di sviluppo su altri progetti nel cloud kppa
installare il framework langchain

npm install @langchain/community @langchain/core @langchain/openai langchain

creare il file generateCodeChain.ts 

e creare le seguenti interfacce

```
export interface GenerateFunctionWithLanguage {
  language: string;
  task: string;
}
export const generateFunctionWithLanguage = async (params: GenerateFunctionWithLanguage) => {};
```

definire una interfaccia per generare prompttemplate

```
import { PromptTemplate } from "@langchain/core/prompts";

export interface GenerateFunctionWithLanguage {
  language: string;
  task: string;
}
export const generateFunctionWithLanguage = async (params: GenerateFunctionWithLanguage) => {
  const codePrompt = new PromptTemplate({
    template: "Write a very short {language} function that will {task}",
    inputVariables: ["language", "task"],
  });
};
```

implementare mano a mano il layer service e business tenendo conto del codice seguente per creare un wrapper llm

```
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";

export interface GenerateFunctionWithLanguage {
  language: string;
  task: string;
}
export const generateFunctionWithLanguage = async (params: GenerateFunctionWithLanguage) => {
  const codePrompt = new PromptTemplate({
    template: "Write a very short {language} function that will {task}",
    inputVariables: ["language", "task"],
  });

  const openAi = new OpenAI({
    openAIApiKey: process.env.OPENAI_KEY,
  });
};
```

tenere in considerazione vari approcci per chiamare un llm

creare una chain llm

```
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "@langchain/core/prompts";
import { OpenAI } from "@langchain/openai";

export interface GenerateFunctionWithLanguage {
  language: string;
  task: string;
}
export const generateFunctionWithLanguage = async (params: GenerateFunctionWithLanguage) => {
  const codePrompt = new PromptTemplate({
    template: "Write a very short {language} function that will {task}",
    inputVariables: ["language", "task"],
  });

  const openAi = new OpenAI({
    openAIApiKey: process.env.OPENAI_KEY,
  });

  const llm = new LLMChain({
    llm: openAi,
    prompt: codePrompt,
    outputKey: "code",
  });

  return llm.call({
    language: params.language,
    task: params.task,
  });
};
```

creare un endpoint rest per esporre la chiamata all'esterno


```
import express from "express";
import dotenv from "dotenv";
import { generateFunctionWithLanguage } from "./generateCodeChain.js";

dotenv.config();

const app: express.Express = express();
const port: string | number = process.env.PORT || 3000;
app.use(express.json());

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

app.post("/generate-code", async (req, res, next) => {
  const codeGenerated = await generateFunctionWithLanguage(req.body);

  res.status(200).send({
    code: codeGenerated.code,
  });
});
```

testare su postman!


Sono stati integrate anche le seguenti librerie tramite npm install

```
axios
socket.io in futuro lo sara
request-ip
-D @types/request-ip
cors
-D @types/cors
http
https
fs
path
body-parser
```




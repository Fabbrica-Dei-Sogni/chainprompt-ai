// Configurazione tabella e colonne: può essere parametrica se vuoi multi-store
export interface VectorStoreConfig {
  tableName: string;
  idColumnName: string;
  vectorColumnName: string;
  contentColumnName: string;
  metadataColumnName?: string;
}
/**
 * LSIF IndexedDB - Graph Database for Code Intelligence
 *
 * Object Stores:
 * 1. vertices - 모든 Vertex 저장
 * 2. edges - 모든 Edge 저장
 * 3. documents - Document index (빠른 조회용)
 */

import type {
  Vertex,
  Edge,
  DocumentIndex,
  VertexRecord,
  EdgeRecord,
  VertexType,
  EdgeLabel,
} from './types';

const DB_NAME = 'lsif-code-index';
const DB_VERSION = 1;

const STORE_VERTICES = 'vertices';
const STORE_EDGES = 'edges';
const STORE_DOCUMENTS = 'documents';

/**
 * IndexedDB 초기화
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Vertices store
      if (!db.objectStoreNames.contains(STORE_VERTICES)) {
        const verticesStore = db.createObjectStore(STORE_VERTICES, {
          keyPath: 'id',
        });
        verticesStore.createIndex('vertexType', 'vertexType', { unique: false });
        verticesStore.createIndex('documentId', 'documentId', { unique: false });
        verticesStore.createIndex('symbolName', 'symbolName', { unique: false });
        console.log('[LSIF DB] Created vertices store');
      }

      // 2. Edges store
      if (!db.objectStoreNames.contains(STORE_EDGES)) {
        const edgesStore = db.createObjectStore(STORE_EDGES, {
          keyPath: 'id',
        });
        edgesStore.createIndex('label', 'label', { unique: false });
        edgesStore.createIndex('outV', 'outV', { unique: false });
        edgesStore.createIndex('inV', 'inV', { unique: false });
        console.log('[LSIF DB] Created edges store');
      }

      // 3. Documents store
      if (!db.objectStoreNames.contains(STORE_DOCUMENTS)) {
        const documentsStore = db.createObjectStore(STORE_DOCUMENTS, {
          keyPath: 'uri',
        });
        documentsStore.createIndex('contentHash', 'contentHash', { unique: false });
        documentsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        console.log('[LSIF DB] Created documents store');
      }
    };
  });
}

// ========================================
// Vertex Operations
// ========================================

/**
 * Vertex 저장
 */
export async function saveVertex(vertex: Vertex): Promise<void> {
  const db = await openDB();
  const now = Date.now();

  const record: VertexRecord = {
    id: vertex.id,
    vertexType: vertex.type,
    data: vertex,
    documentId: 'documentId' in vertex ? vertex.documentId : undefined,
    symbolName: vertex.type === 'resultSet' ? vertex.symbolName : undefined,
    createdAt: now,
    updatedAt: now,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_VERTICES, 'readwrite');
    const store = tx.objectStore(STORE_VERTICES);
    const request = store.put(record);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Vertex 조회 (ID로)
 */
export async function getVertex(id: string): Promise<Vertex | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VERTICES, 'readonly');
      const store = tx.objectStore(STORE_VERTICES);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const record = request.result as VertexRecord | undefined;
        resolve(record ? record.data : null);
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error getting vertex:', error);
    return null;
  }
}

/**
 * Vertex 조회 (조건으로)
 */
export async function queryVertices(
  vertexType: VertexType,
  filter?: {
    documentId?: string;
    symbolName?: string;
  }
): Promise<Vertex[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VERTICES, 'readonly');
      const store = tx.objectStore(STORE_VERTICES);

      // Index 사용
      let request: IDBRequest;
      if (filter?.documentId) {
        const index = store.index('documentId');
        request = index.getAll(filter.documentId);
      } else if (filter?.symbolName) {
        const index = store.index('symbolName');
        request = index.getAll(filter.symbolName);
      } else {
        const index = store.index('vertexType');
        request = index.getAll(vertexType);
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const records = request.result as VertexRecord[];
        const vertices = records
          .filter((r) => r.vertexType === vertexType)
          .map((r) => r.data);
        resolve(vertices);
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error querying vertices:', error);
    return [];
  }
}

/**
 * Vertex 삭제 (documentId로 일괄 삭제)
 */
export async function deleteVerticesByDocument(documentId: string): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_VERTICES, 'readwrite');
      const store = tx.objectStore(STORE_VERTICES);
      const index = store.index('documentId');
      const request = index.openCursor(IDBKeyRange.only(documentId));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error deleting vertices:', error);
  }
}

// ========================================
// Edge Operations
// ========================================

/**
 * Edge 저장
 */
export async function saveEdge(edge: Edge): Promise<void> {
  const db = await openDB();

  const record: EdgeRecord = {
    id: edge.id,
    label: edge.label,
    outV: edge.outV,
    inV: edge.inV,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EDGES, 'readwrite');
    const store = tx.objectStore(STORE_EDGES);
    const request = store.put(record);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Edge 조회 (outV + label로)
 * "이 vertex에서 나가는 특정 label의 edge"
 */
export async function getEdgesByOutV(
  outV: string,
  label?: EdgeLabel
): Promise<Edge[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EDGES, 'readonly');
      const store = tx.objectStore(STORE_EDGES);
      const index = store.index('outV');
      const request = index.getAll(outV);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const records = request.result as EdgeRecord[];
        let edges = records.map((r) => ({
          id: r.id,
          type: 'edge' as const,
          label: r.label,
          outV: r.outV,
          inV: r.inV,
        }));

        if (label) {
          edges = edges.filter((e) => e.label === label);
        }

        resolve(edges);
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error getting edges by outV:', error);
    return [];
  }
}

/**
 * Edge 삭제 (outV로 일괄 삭제)
 */
export async function deleteEdgesByOutV(outV: string): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_EDGES, 'readwrite');
      const store = tx.objectStore(STORE_EDGES);
      const index = store.index('outV');
      const request = index.openCursor(IDBKeyRange.only(outV));

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error deleting edges:', error);
  }
}

// ========================================
// Document Operations
// ========================================

/**
 * Document index 저장
 */
export async function saveDocumentIndex(index: DocumentIndex): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
    const store = tx.objectStore(STORE_DOCUMENTS);
    const request = store.put(index);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

/**
 * Document index 조회
 */
export async function getDocumentIndex(uri: string): Promise<DocumentIndex | null> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const request = store.get(uri);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as DocumentIndex || null);
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error getting document index:', error);
    return null;
  }
}

/**
 * 모든 Document index 조회
 */
export async function getAllDocumentIndexes(): Promise<DocumentIndex[]> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readonly');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result as DocumentIndex[]);
      };
    });
  } catch (error) {
    console.error('[LSIF DB] Error getting all document indexes:', error);
    return [];
  }
}

/**
 * Document index 삭제
 */
export async function deleteDocumentIndex(uri: string): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DOCUMENTS, 'readwrite');
      const store = tx.objectStore(STORE_DOCUMENTS);
      const request = store.delete(uri);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[LSIF DB] Error deleting document index:', error);
  }
}

// ========================================
// Batch Operations
// ========================================

/**
 * Batch 저장 (Vertex + Edge 한 번에)
 */
export async function batchSave(vertices: Vertex[], edges: Edge[]): Promise<void> {
  try {
    const db = await openDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_VERTICES, STORE_EDGES], 'readwrite');
      const verticesStore = tx.objectStore(STORE_VERTICES);
      const edgesStore = tx.objectStore(STORE_EDGES);

      let completed = 0;
      const total = vertices.length + edges.length;

      // Vertices 저장
      vertices.forEach((vertex) => {
        const record: VertexRecord = {
          id: vertex.id,
          vertexType: vertex.type,
          data: vertex,
          documentId: 'documentId' in vertex ? vertex.documentId : undefined,
          symbolName: vertex.type === 'resultSet' ? vertex.symbolName : undefined,
          createdAt: now,
          updatedAt: now,
        };

        const request = verticesStore.put(record);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });

      // Edges 저장
      edges.forEach((edge) => {
        const record: EdgeRecord = {
          id: edge.id,
          label: edge.label,
          outV: edge.outV,
          inV: edge.inV,
          createdAt: now,
        };

        const request = edgesStore.put(record);
        request.onsuccess = () => {
          completed++;
          if (completed === total) resolve();
        };
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error) {
    console.error('[LSIF DB] Error batch saving:', error);
  }
}

/**
 * 전체 Index 초기화
 */
export async function clearAllIndexes(): Promise<void> {
  try {
    const db = await openDB();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(
        [STORE_VERTICES, STORE_EDGES, STORE_DOCUMENTS],
        'readwrite'
      );

      let completed = 0;
      const stores = [
        tx.objectStore(STORE_VERTICES),
        tx.objectStore(STORE_EDGES),
        tx.objectStore(STORE_DOCUMENTS),
      ];

      stores.forEach((store) => {
        const request = store.clear();
        request.onsuccess = () => {
          completed++;
          if (completed === stores.length) {
            console.log('[LSIF DB] Cleared all indexes');
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  } catch (error) {
    console.error('[LSIF DB] Error clearing indexes:', error);
  }
}

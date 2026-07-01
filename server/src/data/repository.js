import { randomUUID } from 'crypto';
import { models, collectionNames } from './modelRegistry.js';

export const repositoryState = {
  mode: 'memory'
};

const memoryDb = Object.fromEntries(collectionNames.map((name) => [name, []]));

function now() {
  return new Date().toISOString();
}

function normalizeRecord(record) {
  if (!record) return null;
  if (typeof record.toJSON === 'function') return record.toJSON();
  const plain = { ...record };
  if (plain._id && !plain.id) plain.id = String(plain._id);
  delete plain._id;
  delete plain.__v;
  return plain;
}

function matchesFilter(record, filter = {}) {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = record[key];
    if (Array.isArray(expected)) return expected.includes(actual);
    if (expected && typeof expected === 'object' && '$in' in expected) {
      return expected.$in.includes(actual);
    }
    return actual === expected;
  });
}

function applySort(items, sort = {}) {
  const entries = Object.entries(sort);
  if (!entries.length) return items;

  return [...items].sort((a, b) => {
    for (const [key, direction] of entries) {
      if (a[key] === b[key]) continue;
      return a[key] > b[key] ? direction : -direction;
    }
    return 0;
  });
}

function assertCollection(collection) {
  if (!models[collection]) {
    throw new Error(`Unknown collection: ${collection}`);
  }
}

async function mongoGetAll(collection, filter = {}, sort = {}) {
  return models[collection].find(filter).sort(sort).lean().then((rows) => rows.map(normalizeRecord));
}

async function memoryGetAll(collection, filter = {}, sort = {}) {
  const rows = memoryDb[collection].filter((record) => matchesFilter(record, filter));
  return applySort(rows, sort).map(normalizeRecord);
}

export const repository = {
  async getAll(collection, filter = {}, sort = {}) {
    assertCollection(collection);
    return repositoryState.mode === 'mongo'
      ? mongoGetAll(collection, filter, sort)
      : memoryGetAll(collection, filter, sort);
  },

  async getById(collection, id) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const row = await models[collection].findById(id).lean();
      return normalizeRecord(row);
    }
    return normalizeRecord(memoryDb[collection].find((record) => record.id === id));
  },

  async getOne(collection, filter = {}) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const row = await models[collection].findOne(filter).lean();
      return normalizeRecord(row);
    }
    return normalizeRecord(memoryDb[collection].find((record) => matchesFilter(record, filter)));
  },

  async create(collection, data) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const row = await models[collection].create(data);
      return normalizeRecord(row);
    }

    const row = {
      id: randomUUID(),
      ...data,
      createdAt: now(),
      updatedAt: now()
    };
    memoryDb[collection].push(row);
    return normalizeRecord(row);
  },

  async updateById(collection, id, updates) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const row = await models[collection].findByIdAndUpdate(id, updates, { new: true }).lean();
      return normalizeRecord(row);
    }

    const index = memoryDb[collection].findIndex((record) => record.id === id);
    if (index === -1) return null;
    memoryDb[collection][index] = { ...memoryDb[collection][index], ...updates, updatedAt: now() };
    return normalizeRecord(memoryDb[collection][index]);
  },

  async upsert(collection, filter, createData, updateData) {
    assertCollection(collection);
    const existing = await this.getOne(collection, filter);
    if (existing) return this.updateById(collection, existing.id, updateData);
    return this.create(collection, { ...filter, ...createData, ...updateData });
  },

  async deleteById(collection, id) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const row = await models[collection].findByIdAndDelete(id).lean();
      return normalizeRecord(row);
    }

    const index = memoryDb[collection].findIndex((record) => record.id === id);
    if (index === -1) return null;
    const [deleted] = memoryDb[collection].splice(index, 1);
    return normalizeRecord(deleted);
  },

  async deleteWhere(collection, filter = {}) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      const result = await models[collection].deleteMany(filter);
      return result.deletedCount;
    }

    const originalLength = memoryDb[collection].length;
    memoryDb[collection] = memoryDb[collection].filter((record) => !matchesFilter(record, filter));
    return originalLength - memoryDb[collection].length;
  },

  async count(collection, filter = {}) {
    assertCollection(collection);
    if (repositoryState.mode === 'mongo') {
      return models[collection].countDocuments(filter);
    }
    return memoryDb[collection].filter((record) => matchesFilter(record, filter)).length;
  }
};

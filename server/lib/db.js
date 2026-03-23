const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = process.env.VERCEL ? '/tmp' : path.join(__dirname, '../data');

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readCollection(collectionName) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeCollection(collectionName, data) {
  await ensureDataDir();
  const filePath = path.join(DATA_DIR, `${collectionName}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

const db = {
  find: async (collection) => await readCollection(collection),
  
  findOne: async (collection, predicate) => {
    const items = await readCollection(collection);
    return items.find(predicate);
  },
  
  findById: async (collection, id) => {
    const items = await readCollection(collection);
    return items.find(item => item._id === id);
  },

  create: async (collection, newItem) => {
    const items = await readCollection(collection);
    const itemWithId = { 
      ...newItem, 
      _id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    items.push(itemWithId);
    await writeCollection(collection, items);
    return itemWithId;
  },

  update: async (collection, id, updateData) => {
    const items = await readCollection(collection);
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updateData, updatedAt: new Date().toISOString() };
    await writeCollection(collection, items);
    return items[index];
  },

  delete: async (collection, id) => {
    const items = await readCollection(collection);
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return false;
    
    items.splice(index, 1);
    await writeCollection(collection, items);
    return true;
  }
};

module.exports = db;


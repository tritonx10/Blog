const { kv } = require('@vercel/kv');

const db = {
  find: async (collection) => {
    try {
      return await kv.get(collection) || [];
    } catch (err) {
      console.error(`KV find error (${collection}):`, err);
      return [];
    }
  },
  
  findOne: async (collection, predicate) => {
    const items = await db.find(collection);
    return items.find(predicate);
  },
  
  findById: async (collection, id) => {
    const items = await db.find(collection);
    return items.find(item => item._id === id);
  },

  create: async (collection, newItem) => {
    const items = await db.find(collection);
    const itemWithId = { 
      ...newItem, 
      _id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    items.push(itemWithId);
    await kv.set(collection, items);
    return itemWithId;
  },

  update: async (collection, id, updateData) => {
    const items = await db.find(collection);
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updateData, updatedAt: new Date().toISOString() };
    await kv.set(collection, items);
    return items[index];
  },

  delete: async (collection, id) => {
    const items = await db.find(collection);
    const index = items.findIndex(item => item._id === id);
    if (index === -1) return false;
    
    items.splice(index, 1);
    await kv.set(collection, items);
    return true;
  }
};

module.exports = db;

const JSON_BLOB_URL = 'https://jsonblob.com/api/jsonBlob/019d1bd7-8b34-7199-bdbe-0600666e0221';

async function readData() {
  try {
    const res = await fetch(JSON_BLOB_URL, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error('Failed to fetch blob');
    return await res.json();
  } catch (err) {
    console.error('Blob fetch error:', err);
    return { posts: [], articles: [], books: [] };
  }
}

async function writeData(data) {
  try {
    const res = await fetch(JSON_BLOB_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update blob');
  } catch (err) {
    console.error('Blob update error:', err);
  }
}

const db = {
  find: async (collection) => {
    const data = await readData();
    return data[collection] || [];
  },
  
  findOne: async (collection, predicate) => {
    const data = await readData();
    const items = data[collection] || [];
    return items.find(predicate);
  },
  
  findById: async (collection, id) => {
    const data = await readData();
    const items = data[collection] || [];
    return items.find(item => item._id === id);
  },

  create: async (collection, newItem) => {
    const data = await readData();
    if (!data[collection]) data[collection] = [];
    
    const itemWithId = { 
      ...newItem, 
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      comments: []
    };
    data[collection].push(itemWithId);
    
    await writeData(data);
    return itemWithId;
  },

  update: async (collection, id, updateData) => {
    const data = await readData();
    if (!data[collection]) return null;
    
    const index = data[collection].findIndex(item => item._id === id);
    if (index === -1) return null;
    
    data[collection][index] = { ...data[collection][index], ...updateData, updatedAt: new Date().toISOString() };
    await writeData(data);
    return data[collection][index];
  },

  delete: async (collection, id) => {
    const data = await readData();
    if (!data[collection]) return false;
    
    const index = data[collection].findIndex(item => item._id === id);
    if (index === -1) return false;
    
    data[collection].splice(index, 1);
    await writeData(data);
    return true;
  }
};

module.exports = db;


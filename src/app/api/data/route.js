import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'slist-data.json');

// 确保数据目录存在
function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 默认数据
const DEFAULT_DATA = {
  stores: [
    { id: "coles", name: "COLES", color: "bg-red-600 hover:bg-red-700" },
    { id: "shidai", name: "时代", color: "bg-yellow-600 hover:bg-yellow-700" },
    { id: "aldi", name: "ALDI", color: "bg-blue-700 hover:bg-blue-800" },
  ],
  shoppingLists: {
    "coles": [],
    "shidai": [],
    "aldi": []
  },
  lastUpdated: new Date().toISOString()
};

// GET - 读取数据
export async function GET() {
  try {
    ensureDataDir();
    
    if (!fs.existsSync(DATA_FILE)) {
      // 如果文件不存在，创建默认数据文件
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2));
      return NextResponse.json(DEFAULT_DATA);
    }
    
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading data:', error);
    return NextResponse.json(DEFAULT_DATA);
  }
}

// POST - 保存数据
export async function POST(request) {
  try {
    ensureDataDir();
    
    const data = await request.json();
    data.lastUpdated = new Date().toISOString();
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true, message: 'Data saved successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save data' },
      { status: 500 }
    );
  }
}
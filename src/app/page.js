"use client";

import { useState, useEffect } from "react";

const DEFAULT_STORES = [
  { id: "coles", name: "COLES", color: "bg-red-600 hover:bg-red-700" },
  { id: "shidai", name: "时代", color: "bg-yellow-600 hover:bg-yellow-700" },
  { id: "aldi", name: "ALDI", color: "bg-blue-700 hover:bg-blue-800" },
];

const COLORS = [
  "bg-red-600 hover:bg-red-700",
  "bg-yellow-600 hover:bg-yellow-700",
  "bg-blue-700 hover:bg-blue-800",
  "bg-black hover:bg-gray-800",
  "bg-green-700 hover:bg-green-800",
  "bg-purple-700 hover:bg-purple-800",
  "bg-pink-600 hover:bg-pink-700",
  "bg-indigo-700 hover:bg-indigo-800",
];

// localStorage存储键名
const STORAGE_KEY = 'slist-data';

// 获取默认数据
const getDefaultData = () => {
  const defaultShoppingLists = {};
  DEFAULT_STORES.forEach(store => {
    defaultShoppingLists[store.id] = [];
  });
  
  return {
    stores: DEFAULT_STORES,
    shoppingLists: defaultShoppingLists
  };
};

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const [stores, setStores] = useState([]);
  const [shoppingLists, setShoppingLists] = useState({});
  const [showAddStore, setShowAddStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#dc2626");
  const [editMode, setEditMode] = useState(false);
  const [swipedItem, setSwipedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  // 从localStorage加载数据
  const loadData = () => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      
      if (savedData) {
        const data = JSON.parse(savedData);
        // 确保数据结构完整
        const validStores = Array.isArray(data.stores) ? data.stores : DEFAULT_STORES;
        const validShoppingLists = data.shoppingLists && typeof data.shoppingLists === 'object' 
          ? data.shoppingLists 
          : getDefaultData().shoppingLists;
        
        setStores(validStores);
        setShoppingLists(validShoppingLists);
      } else {
        // 首次使用，设置默认数据
        const defaultData = getDefaultData();
        setStores(defaultData.stores);
        setShoppingLists(defaultData.shoppingLists);
        // 异步保存默认数据，避免阻塞渲染
        setTimeout(() => {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
        }, 0);
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // 如果localStorage出错，使用默认数据
      const defaultData = getDefaultData();
      setStores(defaultData.stores);
      setShoppingLists(defaultData.shoppingLists);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存数据到localStorage
  const saveData = (newStores = stores, newShoppingLists = shoppingLists) => {
    try {
      setSaveStatus('saving');
      
      const dataToSave = {
        stores: newStores,
        shoppingLists: newShoppingLists,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // 页面加载时读取数据 - 只执行一次
  useEffect(() => {
    loadData();
  }, []); // 空依赖数组，确保只执行一次

  // 防止在加载期间渲染
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-black mb-2">SLIST</div>
          <div className="text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  const addItem = (storeId) => {
    if (!inputValue.trim()) {
      alert('请先输入商品名称！');
      return;
    }
    
    const newItem = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
    };

    const newShoppingLists = {
      ...shoppingLists,
      [storeId]: [...(shoppingLists[storeId] || []), newItem]
    };
    
    setShoppingLists(newShoppingLists);
    setInputValue("");
    
    // 保存数据
    saveData(stores, newShoppingLists);
  };

  const toggleItem = (storeId, itemId) => {
    const newShoppingLists = {
      ...shoppingLists,
      [storeId]: shoppingLists[storeId].map(item => 
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    };
    
    setShoppingLists(newShoppingLists);
    saveData(stores, newShoppingLists);
  };

  const deleteItem = (storeId, itemId) => {
    const newShoppingLists = {
      ...shoppingLists,
      [storeId]: shoppingLists[storeId].filter(item => item.id !== itemId)
    };
    
    setShoppingLists(newShoppingLists);
    setSwipedItem(null);
    saveData(stores, newShoppingLists);
  };

  const handleTouchStart = (e, itemId) => {
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    let moved = false;

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const deltaX = startX - touch.clientX;
      const deltaY = Math.abs(startY - touch.clientY);
      
      if (deltaY > 30) return;
      
      if (deltaX > 50 && !moved) {
        setSwipedItem(itemId);
        moved = true;
      } else if (deltaX < -20 && moved) {
        setSwipedItem(null);
        moved = false;
      }
    };

    const handleTouchEnd = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleItemClick = (storeId, itemId, e) => {
    if (swipedItem === itemId) {
      setSwipedItem(null);
    } else {
      toggleItem(storeId, itemId);
    }
  };

  // 将十六进制颜色转换为Tailwind CSS类
  const hexToTailwindClass = (hexColor) => {
    return `bg-[${hexColor}] hover:bg-[${hexColor}]/80`;
  };

  const addStore = () => {
    if (!newStoreName.trim()) return;
    
    const newStore = {
      id: `store_${Date.now()}`,
      name: newStoreName.trim().toUpperCase(),
      color: hexToTailwindClass(selectedColor)
    };
    
    const newStores = [...stores, newStore];
    const newShoppingLists = {
      ...shoppingLists,
      [newStore.id]: []
    };
    
    setStores(newStores);
    setShoppingLists(newShoppingLists);
    setNewStoreName("");
    setSelectedColor("#dc2626");
    setShowAddStore(false);
    
    // 保存数据
    saveData(newStores, newShoppingLists);
  };

  const deleteStore = (storeId) => {
    const newStores = stores.filter(store => store.id !== storeId);
    const newShoppingLists = { ...shoppingLists };
    delete newShoppingLists[storeId];
    
    setStores(newStores);
    setShoppingLists(newShoppingLists);
    
    // 保存数据
    saveData(newStores, newShoppingLists);
  };

  const archiveAndClear = () => {
    let archiveContent = `SLIST ARCHIVE - ${new Date().toLocaleString('zh-CN')}\n\n`;
    
    stores.forEach(store => {
      const items = shoppingLists[store.id] || [];
      if (items.length > 0) {
        archiveContent += `${store.name}:\n`;
        items.forEach(item => {
          archiveContent += `${item.completed ? '[X]' : '[ ]'} ${item.text}\n`;
        });
        archiveContent += '\n';
      }
    });

    const blob = new Blob([archiveContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `slist-archive-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const clearedLists = {};
    stores.forEach(store => {
      clearedLists[store.id] = [];
    });
    
    setShoppingLists(clearedLists);
    saveData(stores, clearedLists);
  };

  const hasAnyItems = Object.values(shoppingLists).some(list => list && list.length > 0);

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Header - 紧凑版 */}
      <div className="bg-black text-white border-b-4 border-black sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl font-black tracking-wide transform -skew-x-6 bg-white text-black px-3 py-1 border-2 border-black">
              SLIST
            </h1>
            <div className="flex items-center gap-2">
              {/* 保存状态指示器 */}
              {saveStatus && (
                <div className={`px-2 py-1 text-xs font-black border-2 ${
                  saveStatus === 'saving' ? 'bg-yellow-500 border-yellow-500 text-black' :
                  saveStatus === 'saved' ? 'bg-green-500 border-green-500 text-white' :
                  'bg-red-500 border-red-500 text-white'
                }`}>
                  {saveStatus === 'saving' ? 'SAVING...' :
                   saveStatus === 'saved' ? 'SAVED' : 'ERROR'}
                </div>
              )}
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-1 font-black text-xs tracking-wide border-2 transition-all transform hover:scale-105 ${
                  editMode 
                    ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                    : 'bg-white text-black border-white hover:bg-gray-200'
                }`}
              >
                {editMode ? 'DONE' : 'EDIT'}
              </button>
            </div>
          </div>
          
          {/* Input - 紧凑版 */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ADD PRODUCT..."
            className="w-full px-4 py-2 bg-white text-black border-2 border-black font-black text-base tracking-wide placeholder-gray-500 focus:outline-none focus:border-red-600 focus:bg-yellow-100 transition-all"
            onKeyPress={(e) => e.key === 'Enter' && stores.length > 0 && addItem(stores[0].id)}
          />
          
          {/* Store Buttons - 紧凑网格 */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {stores.map(store => (
              <div key={store.id} className="relative">
                <button
                  onClick={() => !editMode && addItem(store.id)}
                  disabled={editMode}
                  className={`${store.color} ${editMode ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} text-white font-black py-2 px-3 border-2 border-black transition-all transform text-xs tracking-wide w-full shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                >
                  {store.name}
                  {!editMode && shoppingLists[store.id] && shoppingLists[store.id].length > 0 && (
                    <span className="ml-1 bg-white text-black rounded-none px-1 py-0.5 text-xs font-black border border-black">
                      {shoppingLists[store.id].length}
                    </span>
                  )}
                </button>
                {editMode && (
                  <button
                    onClick={() => deleteStore(store.id)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 hover:bg-red-700 text-white border-2 border-black flex items-center justify-center text-sm font-black transition-all transform hover:scale-110 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            
            {/* Add Store Button - 紧凑版 */}
            <button
              onClick={() => setShowAddStore(true)}
              className="bg-gray-300 hover:bg-gray-400 hover:scale-105 text-black font-black py-2 px-3 border-2 border-black transition-all transform text-xs tracking-wide flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="text-xs font-black">+</span>
            </button>
          </div>
          
          {editMode && (
            <div className="mt-2 text-center">
              <p className="text-white font-black text-xs tracking-wide bg-red-600 px-2 py-1 border-2 border-white inline-block transform -skew-x-3">
                CLICK × TO DELETE
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Store Modal - 紧凑版 */}
      {showAddStore && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-4 border-black p-4 w-full max-w-sm shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-lg font-black mb-3 tracking-wide text-center bg-black text-white px-3 py-1 border-2 border-black transform -skew-x-3">
              ADD STORE
            </h3>
            <input
              type="text"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
              placeholder="STORE NAME"
              className="w-full px-3 py-2 border-2 border-black font-black text-base tracking-wide placeholder-gray-500 focus:outline-none focus:border-red-600 focus:bg-yellow-100 mb-3"
              onKeyPress={(e) => e.key === 'Enter' && addStore()}
              autoFocus
            />
            
            {/* 自定义颜色选择器 */}
            <div className="mb-3">
              <p className="text-xs font-black mb-2 tracking-wide">CHOOSE COLOR:</p>
              <div className="flex items-center gap-3">
                {/* 颜色预览 */}
                <div 
                  className="w-12 h-8 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  style={{ backgroundColor: selectedColor }}
                ></div>
                
                {/* 颜色选择器 */}
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-12 h-8 border-2 border-black cursor-pointer bg-transparent"
                  title="选择颜色"
                />
                
                {/* 颜色值显示 */}
                <span className="text-xs font-black tracking-wide text-gray-600">
                  {selectedColor.toUpperCase()}
                </span>
              </div>
              
              {/* 快速颜色选择 */}
              <div className="mt-2">
                <p className="text-xs font-black mb-1 tracking-wide text-gray-600">QUICK COLORS:</p>
                <div className="flex gap-1">
                  {[
                    "#dc2626", // 红色
                    "#ca8a04", // 黄色
                    "#1d4ed8", // 蓝色
                    "#000000", // 黑色
                    "#15803d", // 绿色
                    "#7c2d12", // 紫色
                    "#be185d", // 粉色
                    "#1e40af"  // 靛蓝色
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-6 h-6 border border-black hover:scale-110 transition-transform ${
                        selectedColor === color ? 'ring-2 ring-black' : ''
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    ></button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddStore(false);
                  setNewStoreName("");
                  setSelectedColor("#dc2626");
                }}
                className="flex-1 px-3 py-2 border-2 border-black text-black font-black hover:bg-gray-200 transition-all transform hover:scale-105 tracking-wide text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                CANCEL
              </button>
              <button
                onClick={addStore}
                disabled={!newStoreName.trim()}
                className="flex-1 px-3 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white border-2 border-black font-black transition-all transform hover:scale-105 tracking-wide text-xs shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Lists - 紧凑卡片 */}
      <div className="max-w-md mx-auto px-4 py-3">
        {stores.map(store => {
          const items = shoppingLists[store.id] || [];
          if (items.length === 0) return null;
          
          return (
            <div key={store.id} className="mb-4">
              <div className="flex items-center mb-2 bg-black text-white px-3 py-2 border-2 border-black transform -skew-x-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
                <div className={`w-3 h-3 border border-white mr-2 ${store.color.split(' ')[0]}`}></div>
                <h2 className="font-black text-sm tracking-wide">{store.name}</h2>
                <span className="ml-auto text-xs font-black bg-white text-black px-1 py-0.5 border border-white">
                  {items.length}
                </span>
              </div>
              
              <div className="space-y-1">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-white border-2 border-black overflow-hidden relative shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]"
                  >
                    {/* 商品内容区域 */}
                    <div 
                      className={`flex items-center transition-transform duration-200 ${
                        swipedItem === item.id ? '-translate-x-16' : 'translate-x-0'
                      }`}
                      onTouchStart={(e) => handleTouchStart(e, item.id)}
                    >
                      <button
                        onClick={(e) => handleItemClick(store.id, item.id, e)}
                        className="flex-1 px-3 py-2 text-left hover:bg-gray-100 transition-colors font-black tracking-wide"
                      >
                        <span className={`text-sm ${
                          item.completed 
                            ? 'line-through text-gray-500 bg-gray-200 px-1 py-0.5' 
                            : 'text-black'
                        }`}>
                          {item.text.toUpperCase()}
                        </span>
                      </button>
                    </div>
                    
                    {/* 删除按钮区域 - 更窄 */}
                    <div className={`absolute top-0 right-0 h-full w-16 bg-red-600 border-l-2 border-black flex items-center justify-center transition-transform duration-200 ${
                      swipedItem === item.id ? 'translate-x-0' : 'translate-x-full'
                    }`}>
                      <button
                        onClick={() => deleteItem(store.id, item.id)}
                        className="text-white hover:bg-red-700 w-full h-full flex items-center justify-center transition-colors font-black text-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {/* Archive Button - 紧凑版 */}
        {hasAnyItems && (
          <div className="mt-6">
            <button
              onClick={archiveAndClear}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 px-4 border-2 border-black transition-all transform hover:scale-105 flex items-center justify-center tracking-wide text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className="mr-2 text-lg">↓</span>
              ARCHIVE & CLEAR ALL
            </button>
          </div>
        )}
        
        {!hasAnyItems && (
          <div className="text-center py-8">
            <div className="bg-black text-white px-4 py-3 border-2 border-black inline-block transform rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]">
              <div className="text-2xl font-black mb-1">📝</div>
              <p className="font-black tracking-wide text-sm">ADD PRODUCTS<br/>TO START!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

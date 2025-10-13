"use client";

import { Store, Calendar, DollarSign } from "lucide-react";

interface ShopData {
  shopId: string;
  shopName: string;
  contractStartDate: string;
  totalAmount: number;
}

interface ShopStatsProps {
  data: ShopData[];
}

export default function ShopStats({ data }: ShopStatsProps) {
  // 过滤掉金额为0的店铺
  const activeShops = data.filter(shop => shop.totalAmount > 0);
  const totalAmount = activeShops.reduce((sum, shop) => sum + shop.totalAmount, 0);

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">店铺统计</h2>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>共 {activeShops.length} 个活跃店铺</span>
          <span>总金额: ¥{totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeShops.map((shop, index) => (
          <div
            key={shop.shopId}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-500">
                  #{index + 1}
                </span>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                ¥{shop.totalAmount.toFixed(2)}
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
              {shop.shopName}
            </h3>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span>门店ID: {shop.shopId}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>合同开始: {shop.contractStartDate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {activeShops.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          暂无活跃店铺数据
        </div>
      )}
    </div>
  );
}

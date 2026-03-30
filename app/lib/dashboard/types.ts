export interface DailyData {
  date: string;
  totalAmount: number;
  shopCount: number;
}

export interface DashboardDataSet {
  fixedFeeData: DailyData[];
  elmCycleData: DailyData[];
  meituanData: DailyData[];
  meituanOfflineData: DailyData[];
  meituanRefundData: DailyData[];
}

export const EMPTY_DASHBOARD_DATA: DashboardDataSet = {
  fixedFeeData: [],
  elmCycleData: [],
  meituanData: [],
  meituanOfflineData: [],
  meituanRefundData: [],
};

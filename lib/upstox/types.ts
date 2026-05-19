export interface UpstoxToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  email?: string;
  user_name?: string;
  user_id?: string;
  broker?: string;
}

export interface MarketQuote {
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  depth: {
    buy: OrderDepthEntry[];
    sell: OrderDepthEntry[];
  };
  timestamp: string;
  instrument_token: string;
  symbol: string;
  last_price: number;
  volume: number;
  average_price: number;
  oi: number;
  net_change: number;
  total_buy_quantity: number;
  total_sell_quantity: number;
  lower_circuit_limit: number;
  upper_circuit_limit: number;
  last_trade_time: string;
  oi_day_high: number;
  oi_day_low: number;
}

export interface OrderDepthEntry {
  quantity: number;
  price: number;
  orders: number;
}

export interface HistoricalCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

export interface Instrument {
  instrument_key: string;
  exchange_token: string;
  tradingsymbol: string;
  name: string;
  last_price: number;
  expiry?: string;
  strike?: number;
  tick_size: number;
  lot_size: number;
  instrument_type: string;
  exchange: string;
  segment: string;
}

export interface Holding {
  isin: string;
  cnc_used_quantity: number;
  collateral_type: string;
  company_name: string;
  haircut: number;
  average_price: number;
  quantity: number;
  used_quantity: number;
  t1_quantity: number;
  exchange: string;
  trading_symbol: string;
  instrument_token: string;
  last_price?: number;
  pnl?: number;
  day_change?: number;
  day_change_percentage?: number;
}

export interface Position {
  exchange: string;
  multiplier: number;
  value: number;
  pnl: number;
  product: string;
  instrument_token: string;
  average_price: number;
  buy_value: number;
  overnight_quantity: number;
  day_buy_value: number;
  day_buy_price: number;
  overnight_buy_amount: number;
  overnight_buy_quantity: number;
  day_buy_quantity: number;
  day_sell_value: number;
  day_sell_price: number;
  overnight_sell_amount: number;
  overnight_sell_quantity: number;
  day_sell_quantity: number;
  quantity: number;
  last_price: number;
  unrealised: number;
  realised: number;
  sell_value: number;
  trading_symbol: string;
  close_price: number;
  buy_price: number;
  sell_price: number;
}

export interface UpstoxApiResponse<T> {
  status: string;
  data: T;
}

export interface PortfolioMetrics {
  totalInvestment: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
  holdings: Holding[];
}

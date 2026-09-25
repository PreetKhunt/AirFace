import { render, screen, waitFor } from '@testing-library/react';
import OverviewPage from '@/app/page';
import RouteExplorerPage from '@/app/route-explorer/page';
import BookingHorizonPage from '@/app/booking-horizon/page';
import CollectionMonitorPage from '@/app/collection-monitor/page';
import DataQualityPage from '@/app/data-quality/page';
import BacktestPage from '@/app/backtest/page';
import ProvenanceExplorerPage from '@/app/provenance/page';
import MethodologyPage from '@/app/methodology/page';
import DataCleaningPage from '@/app/data-cleaning/page';
import SystemStatusPage from '@/app/system-status/page';
import IndexAnalyticsPage from '@/app/index-analytics/page';

// Mock recharts to avoid rendering issues in JSDOM
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    LineChart: () => <div>LineChart Mock</div>,
    BarChart: () => <div>BarChart Mock</div>,
    AreaChart: () => <div>AreaChart Mock</div>,
  };
});

describe('Dashboard Component Rendering & Data Modes', () => {
  
  test('Overview renders the AirFace experience', () => {
    render(<OverviewPage />);
    expect(screen.getAllByText(/UNDERSTANDING/i).length).toBeGreaterThan(0);
  });

  test('Route Explorer renders correctly', () => {
    render(<RouteExplorerPage />);
    expect(screen.getByText(/Route Intelligence/i)).toBeTruthy();
  });

  test('Booking Horizon renders correctly', () => {
    render(<BookingHorizonPage />);
    expect(screen.getByText(/Booking Horizon Escalation/i)).toBeTruthy();
  });

  test('Index Analytics renders correctly', () => {
    render(<IndexAnalyticsPage />);
    expect(screen.getByText(/Index Aggregation Engine/i)).toBeTruthy();
  });

  test('Collection Monitor renders correctly', () => {
    render(<CollectionMonitorPage />);
    expect(screen.getByText(/Data Operations/i)).toBeTruthy();
  });

  test('Data Quality renders correctly', () => {
    render(<DataQualityPage />);
    expect(screen.getByText(/Data Quality Scores/i)).toBeTruthy();
  });

  test('Data Cleaning Explorer renders correctly', () => {
    render(<DataCleaningPage />);
    expect(screen.getByText(/DATA CLEANING/i)).toBeTruthy();
  });

  test('Backtest Page renders correctly', () => {
    render(<BacktestPage />);
    expect(screen.getByText(/Prototype Reference Validation/i)).toBeTruthy();
  });

  test('Provenance Explorer renders correctly', () => {
    render(<ProvenanceExplorerPage />);
    expect(screen.getByText(/Provenance Explorer/i)).toBeTruthy();
  });

  test('System Status renders correctly', () => {
    render(<SystemStatusPage />);
    expect(screen.getByText(/System Status & Health/i)).toBeTruthy();
  });

  test('Methodology Page renders correctly', () => {
    render(<MethodologyPage />);
    expect(screen.getByText(/Methodology & Mathematical Framework/i)).toBeTruthy();
    expect(screen.getByText(/Tier 1 Elementary Jevons Index/i)).toBeTruthy();
  });

});

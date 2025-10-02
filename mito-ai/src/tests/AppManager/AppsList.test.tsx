/*
 * Copyright (c) Saga Inc.
 * Distributed under the terms of the GNU Affero General Public License v3.0 License.
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AppsList } from '../../Extensions/AppManager/AppsList';
import { IAppManagerService } from '../../Extensions/AppManager/ManageAppsPlugin';
import { AppMetadata, GetAppsResponse } from '../../Extensions/AppManager/ListAppsAPI';

// Mock the auth module
jest.mock('../../Extensions/AppDeploy/auth', () => ({
  logoutAndClearJWTTokens: jest.fn(),
  getJWTToken: jest.fn().mockResolvedValue('mock-jwt-token')
}));

// Mock the ListAppsAPI module
jest.mock('../../Extensions/AppManager/ListAppsAPI', () => ({
  fetchUserApps: jest.fn(),
  isGetAppsSuccess: jest.fn(),
  isGetAppsFailure: jest.fn()
}));

// Mock the copyIcon
jest.mock('@jupyterlab/ui-components', () => ({
  copyIcon: {
    react: ({ width, height, fill }: any) => (
      <svg width={width} height={height} fill={fill} data-testid="copy-icon">
        Copy
      </svg>
    )
  }
}));

// Create mock app manager service
const createMockAppManagerService = (): IAppManagerService => ({
  client: {
    sendMessage: jest.fn(),
    serverSettings: {
      token: 'mock-token'
    }
  } as any
});

// Mock data
const mockApps: AppMetadata[] = [
  {
    name: 'Test App 1',
    url: 'https://test1.example.com',
    status: 'active',
    lastDeployedAt: '2024-01-01 00:00'
  },
  {
    name: 'Test App 2',
    url: 'https://test2.example.com',
    status: 'shut down',
    lastDeployedAt: '2024-01-02 00:00'
  },
  {
    name: 'Test App 3',
    url: 'https://test3.example.com',
    status: 'deploying',
    lastDeployedAt: '2024-01-03 00:00'
  }
];

const mockSuccessResponse: GetAppsResponse = {
  apps: mockApps,
  success: true
};

const mockErrorResponse: GetAppsResponse = {
  success: false,
  errorMessage: 'Failed to load apps'
};

describe('AppsList Component', () => {
  let mockAppManagerService: IAppManagerService;
  let mockFetchUserApps: jest.MockedFunction<typeof import('../../Extensions/AppManager/ListAppsAPI').fetchUserApps>;
  let mockIsGetAppsSuccess: jest.MockedFunction<typeof import('../../Extensions/AppManager/ListAppsAPI').isGetAppsSuccess>;
  let mockIsGetAppsFailure: jest.MockedFunction<typeof import('../../Extensions/AppManager/ListAppsAPI').isGetAppsFailure>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppManagerService = createMockAppManagerService();
    
    const apiModule = require('../../Extensions/AppManager/ListAppsAPI');
    mockFetchUserApps = apiModule.fetchUserApps as jest.MockedFunction<typeof apiModule.fetchUserApps>;
    mockIsGetAppsSuccess = apiModule.isGetAppsSuccess as jest.MockedFunction<typeof apiModule.isGetAppsSuccess>;
    mockIsGetAppsFailure = apiModule.isGetAppsFailure as jest.MockedFunction<typeof apiModule.isGetAppsFailure>;
    
    // Set up default mock implementations
    mockIsGetAppsSuccess.mockImplementation((response: any) => response.success === true);
    mockIsGetAppsFailure.mockImplementation((response: any) => response.success === false);
  });

  describe('Rendering States', () => {
    test('should render loading state initially', () => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      expect(screen.getByText('Loading apps...')).toBeInTheDocument();
    });

    test('should render apps list when data loads successfully', async () => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
        expect(screen.getByText('Test App 2')).toBeInTheDocument();
        expect(screen.getByText('Test App 3')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Loading apps...')).not.toBeInTheDocument();
    });

    test('should render empty state when no apps', async () => {
      mockFetchUserApps.mockResolvedValue({
        apps: [],
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('No apps deployed yet')).toBeInTheDocument();
      });
    });

    test('should render error state when API call fails', async () => {
      mockFetchUserApps.mockResolvedValue(mockErrorResponse);
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load apps')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    test('should render error state when API throws exception', async () => {
      mockFetchUserApps.mockRejectedValue(new Error('Network error'));
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Error: Network error')).toBeInTheDocument();
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('App Item Display', () => {
    beforeEach(() => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
    });

    test('should display app name correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
        expect(screen.getByText('Test App 2')).toBeInTheDocument();
      });
    });

    test('should display app URL correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('https://test1.example.com')).toBeInTheDocument();
        expect(screen.getByText('https://test2.example.com')).toBeInTheDocument();
      });
    });

    test('should display app status correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Shut down')).toBeInTheDocument();
        expect(screen.getByText('Deploying')).toBeInTheDocument();
      });
    });

    test('should display last deployed date correctly', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Last Deployed at: 2024-01-01 00:00')).toBeInTheDocument();
        expect(screen.getByText('Last Deployed at: 2024-01-02 00:00')).toBeInTheDocument();
      });
    });

    test('should display copy button for each app', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        const copyButtons = screen.getAllByTestId('copy-icon');
        expect(copyButtons).toHaveLength(3);
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockFetchUserApps.mockResolvedValue(mockSuccessResponse);
      
      // Mock the clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined)
        }
      });
    });

    test('should call navigator.clipboard.writeText when copy button is clicked', async () => {
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test App 1')).toBeInTheDocument();
      });
      
      // Get the first copy button (for Test App 1)
      const copyButtons = screen.getAllByTestId('copy-icon');
      expect(copyButtons).toHaveLength(3); // Should have 3 copy buttons for 3 apps
      const firstCopyButton = copyButtons[0]!;
      expect(firstCopyButton).toBeInTheDocument();
      fireEvent.click(firstCopyButton);
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://test1.example.com');
    });
  });
  

  describe('Edge Cases', () => {
    test('should handle apps with missing optional fields', async () => {
      const incompleteApps = [
        {
          name: 'Incomplete App',
          url: 'https://incomplete.example.com',
          status: 'active' as const,
          lastDeployedAt: '2024-01-01 00:00'
        }
      ];
      
      mockFetchUserApps.mockResolvedValue({
        apps: incompleteApps,
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete App')).toBeInTheDocument();
        expect(screen.getByText('https://incomplete.example.com')).toBeInTheDocument();
      });
    });

    test('should handle very long URLs gracefully', async () => {
      const longUrlApp = {
        name: 'Long URL App',
        url: 'https://very-long-subdomain-name-that-might-cause-layout-issues.example.com/very/deep/path/with/many/segments',
        status: 'active' as const,
        lastDeployedAt: '2024-01-01 00:00'
      };
      
      mockFetchUserApps.mockResolvedValue({
        apps: [longUrlApp],
        success: true
      });
      
      render(<AppsList appManagerService={mockAppManagerService} />);
      
      await waitFor(() => {
        expect(screen.getByText(longUrlApp.url)).toBeInTheDocument();
      });
    });
  });
});

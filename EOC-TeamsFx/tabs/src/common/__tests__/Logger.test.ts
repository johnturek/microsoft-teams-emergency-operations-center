import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';
import Logger from '../Logger';

describe('Logger', () => {
    let mockAppInsights: jest.Mocked<ApplicationInsights>;
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
        mockAppInsights = {
            trackTrace: jest.fn(),
            trackException: jest.fn(),
            trackEvent: jest.fn(),
            trackMetric: jest.fn(),
        } as any;

        Logger.initialize(mockAppInsights);
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.env.NODE_ENV = originalEnv;
    });

    describe('info', () => {
        it('should track info messages to Application Insights', () => {
            Logger.info('Test message', { key: 'value' });

            expect(mockAppInsights.trackTrace).toHaveBeenCalledWith(
                {
                    message: 'Test message',
                    severityLevel: SeverityLevel.Information,
                },
                { key: 'value' }
            );
        });

        it('should work without properties', () => {
            Logger.info('Test message');

            expect(mockAppInsights.trackTrace).toHaveBeenCalledWith(
                {
                    message: 'Test message',
                    severityLevel: SeverityLevel.Information,
                },
                undefined
            );
        });
    });

    describe('warn', () => {
        it('should track warnings to Application Insights', () => {
            Logger.warn('Warning message', { component: 'Test' });

            expect(mockAppInsights.trackTrace).toHaveBeenCalledWith(
                {
                    message: 'Warning message',
                    severityLevel: SeverityLevel.Warning,
                },
                { component: 'Test' }
            );
        });
    });

    describe('error', () => {
        it('should track exceptions to Application Insights', () => {
            const error = new Error('Test error');
            Logger.error('Error occurred', error, { context: 'test' });

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                {
                    exception: error,
                    severityLevel: SeverityLevel.Error,
                },
                { context: 'test' }
            );
        });

        it('should handle non-Error objects', () => {
            Logger.error('Error occurred', 'string error', { context: 'test' });

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                {
                    exception: expect.any(Error),
                    severityLevel: SeverityLevel.Error,
                },
                { context: 'test' }
            );
        });

        it('should track error message without exception', () => {
            Logger.error('Error message');

            expect(mockAppInsights.trackTrace).toHaveBeenCalledWith(
                {
                    message: 'Error message',
                    severityLevel: SeverityLevel.Error,
                },
                undefined
            );
        });
    });

    describe('trackEvent', () => {
        it('should track custom events', () => {
            Logger.trackEvent('ButtonClick', { buttonId: 'submit' }, { clickCount: 1 });

            expect(mockAppInsights.trackEvent).toHaveBeenCalledWith(
                { name: 'ButtonClick' },
                { buttonId: 'submit' },
                { clickCount: 1 }
            );
        });
    });

    describe('trackMetric', () => {
        it('should track performance metrics', () => {
            Logger.trackMetric('PageLoadTime', 1500, { page: 'dashboard' });

            expect(mockAppInsights.trackMetric).toHaveBeenCalledWith(
                { name: 'PageLoadTime', average: 1500 },
                { page: 'dashboard' }
            );
        });
    });

    describe('logComponentError', () => {
        it('should log component errors with context', () => {
            const error = new Error('Component failed');
            Logger.logComponentError('Dashboard', 'loadData', error, 'user@example.com');

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                {
                    exception: error,
                    severityLevel: SeverityLevel.Error,
                },
                {
                    Component: 'Dashboard',
                    Method: 'loadData',
                    User: 'user@example.com',
                }
            );
        });

        it('should handle missing user principal name', () => {
            const error = new Error('Component failed');
            Logger.logComponentError('Dashboard', 'loadData', error);

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    User: 'Unknown',
                })
            );
        });
    });

    describe('logGraphError', () => {
        it('should log Graph API errors with context', () => {
            const error = { statusCode: 404, message: 'Not Found' };
            Logger.logGraphError('/sites/test', error, 'GetSite');

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                expect.anything(),
                {
                    Endpoint: '/sites/test',
                    Operation: 'GetSite',
                    ErrorCode: 404,
                    ErrorMessage: 'Not Found',
                }
            );
        });

        it('should handle errors without status code', () => {
            const error = new Error('Network error');
            Logger.logGraphError('/sites/test', error);

            expect(mockAppInsights.trackException).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    ErrorCode: 'Unknown',
                })
            );
        });
    });
});

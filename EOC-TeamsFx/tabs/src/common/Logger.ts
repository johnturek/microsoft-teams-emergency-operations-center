import { ApplicationInsights, SeverityLevel } from '@microsoft/applicationinsights-web';

/**
 * Centralized logging utility for the TEOC application.
 * Replaces direct console.log usage with proper logging that:
 * - Only logs to console in development
 * - Sends logs to Application Insights in production
 * - Provides structured logging with context
 */
export class Logger {
    private static appInsights?: ApplicationInsights;
    private static isDevelopment = process.env.NODE_ENV === 'development';

    /**
     * Initialize the logger with Application Insights instance
     */
    static initialize(appInsights: ApplicationInsights): void {
        Logger.appInsights = appInsights;
    }

    /**
     * Log informational messages
     * In development: logs to console
     * In production: sends to Application Insights
     */
    static info(message: string, properties?: Record<string, any>): void {
        if (Logger.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[INFO] ${message}`, properties || '');
        }

        if (Logger.appInsights) {
            Logger.appInsights.trackTrace({
                message,
                severityLevel: SeverityLevel.Information,
            }, properties);
        }
    }

    /**
     * Log warning messages
     */
    static warn(message: string, properties?: Record<string, any>): void {
        // Allow console.warn in both dev and prod as per ESLint config
        console.warn(`[WARN] ${message}`, properties || '');

        if (Logger.appInsights) {
            Logger.appInsights.trackTrace({
                message,
                severityLevel: SeverityLevel.Warning,
            }, properties);
        }
    }

    /**
     * Log error messages and exceptions
     */
    static error(
        message: string,
        error?: Error | any,
        properties?: Record<string, any>
    ): void {
        // Allow console.error in both dev and prod as per ESLint config
        console.error(`[ERROR] ${message}`, error || '', properties || '');

        if (Logger.appInsights && error) {
            Logger.appInsights.trackException({
                exception: error instanceof Error ? error : new Error(String(error)),
                severityLevel: SeverityLevel.Error,
            }, properties);
        } else if (Logger.appInsights) {
            Logger.appInsights.trackTrace({
                message,
                severityLevel: SeverityLevel.Error,
            }, properties);
        }
    }

    /**
     * Track custom events for analytics
     */
    static trackEvent(
        eventName: string,
        properties?: Record<string, any>,
        measurements?: Record<string, number>
    ): void {
        if (Logger.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[EVENT] ${eventName}`, { properties, measurements });
        }

        if (Logger.appInsights) {
            Logger.appInsights.trackEvent({ name: eventName }, properties, measurements);
        }
    }

    /**
     * Track performance metrics
     */
    static trackMetric(
        name: string,
        average: number,
        properties?: Record<string, any>
    ): void {
        if (Logger.isDevelopment) {
            // eslint-disable-next-line no-console
            console.log(`[METRIC] ${name}: ${average}`, properties || '');
        }

        if (Logger.appInsights) {
            Logger.appInsights.trackMetric({ name, average }, properties);
        }
    }

    /**
     * Log component-specific errors with context
     */
    static logComponentError(
        componentName: string,
        methodName: string,
        error: Error | any,
        userPrincipalName?: string
    ): void {
        const properties = {
            Component: componentName,
            Method: methodName,
            User: userPrincipalName || 'Unknown',
        };

        Logger.error(
            `${componentName}.${methodName} failed`,
            error,
            properties
        );
    }

    /**
     * Log Graph API errors with request context
     */
    static logGraphError(
        endpoint: string,
        error: Error | any,
        operation: string = 'GraphAPI'
    ): void {
        const properties = {
            Endpoint: endpoint,
            Operation: operation,
            ErrorCode: error?.statusCode || 'Unknown',
            ErrorMessage: error?.message || String(error),
        };

        Logger.error(
            `Graph API call failed: ${endpoint}`,
            error,
            properties
        );
    }
}

export default Logger;

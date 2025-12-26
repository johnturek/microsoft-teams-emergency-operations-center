// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Application Insights
jest.mock('@microsoft/applicationinsights-web', () => ({
    ApplicationInsights: jest.fn().mockImplementation(() => ({
        trackEvent: jest.fn(),
        trackException: jest.fn(),
        trackTrace: jest.fn(),
        trackMetric: jest.fn(),
    })),
    SeverityLevel: {
        Verbose: 0,
        Information: 1,
        Warning: 2,
        Error: 3,
        Critical: 4,
    },
}));

// Mock Microsoft Teams SDK
jest.mock('@microsoft/teams-js', () => ({
    app: {
        initialize: jest.fn().mockResolvedValue(undefined),
        getContext: jest.fn().mockResolvedValue({
            user: {
                id: 'test-user-id',
                displayName: 'Test User',
                userPrincipalName: 'testuser@example.com',
            },
            team: {
                groupId: 'test-group-id',
            },
            channel: {
                id: 'test-channel-id',
            },
        }),
    },
    pages: {
        config: {
            registerOnSaveHandler: jest.fn(),
            setValidityState: jest.fn(),
        },
    },
}));

// Mock window.fetch for API calls
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
    })
) as jest.Mock;

// Suppress console errors in tests (optional)
const originalError = console.error;
beforeAll(() => {
    console.error = jest.fn();
});

afterAll(() => {
    console.error = originalError;
});

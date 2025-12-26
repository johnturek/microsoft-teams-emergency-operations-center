import { Client } from '@microsoft/microsoft-graph-client';
import CommonService from '../CommonService';

// Mock the Graph client
const mockGraph = {
    api: jest.fn().mockReturnThis(),
    get: jest.fn(),
    post: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
} as unknown as Client;

describe('CommonService', () => {
    let service: CommonService;

    beforeEach(() => {
        service = new CommonService();
        jest.clearAllMocks();
    });

    describe('isValidHttpUrl', () => {
        it('should return true for valid HTTPS URLs', () => {
            const result = service.isValidHttpUrl('https://example.com');
            expect(result).toBe(true);
        });

        it('should return true for valid HTTP URLs', () => {
            const result = service.isValidHttpUrl('http://example.com');
            expect(result).toBe(true);
        });

        it('should return false for invalid URLs', () => {
            expect(service.isValidHttpUrl('not-a-url')).toBe(false);
            expect(service.isValidHttpUrl('ftp://example.com')).toBe(false);
            expect(service.isValidHttpUrl('')).toBe(false);
        });

        it('should return false for malformed URLs', () => {
            expect(service.isValidHttpUrl('http://')).toBe(false);
            expect(service.isValidHttpUrl('https://')).toBe(false);
        });
    });

    describe('getInputRegexValidationInitialState', () => {
        it('should return initial validation state with no errors', () => {
            const state = service.getInputRegexValidationInitialState();

            expect(state).toEqual({
                incidentNameHasError: false,
                incidentCloudStorageLinkHasError: false,
            });
        });
    });

    describe('regexValidation', () => {
        it('should validate incident name without special characters', () => {
            const incidentInfo = {
                incidentName: 'Valid Incident Name',
                cloudStorageLink: 'https://example.com',
                guestUsers: [],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.inputRegexValidationObj.incidentNameHasError).toBe(false);
        });

        it('should flag incident name with # character', () => {
            const incidentInfo = {
                incidentName: 'Invalid#Name',
                cloudStorageLink: '',
                guestUsers: [],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.inputRegexValidationObj.incidentNameHasError).toBe(true);
        });

        it('should flag incident name with & character', () => {
            const incidentInfo = {
                incidentName: 'Invalid&Name',
                cloudStorageLink: '',
                guestUsers: [],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.inputRegexValidationObj.incidentNameHasError).toBe(true);
        });

        it('should validate cloud storage link URL', () => {
            const incidentInfo = {
                incidentName: 'Valid Name',
                cloudStorageLink: 'https://sharepoint.com/sites/test',
                guestUsers: [],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.inputRegexValidationObj.incidentCloudStorageLinkHasError).toBe(false);
        });

        it('should flag invalid cloud storage link', () => {
            const incidentInfo = {
                incidentName: 'Valid Name',
                cloudStorageLink: 'not-a-valid-url',
                guestUsers: [],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.inputRegexValidationObj.incidentCloudStorageLinkHasError).toBe(true);
        });

        it('should validate guest user emails', () => {
            const incidentInfo = {
                incidentName: 'Valid Name',
                cloudStorageLink: '',
                guestUsers: [
                    { email: 'valid@example.com' },
                    { email: 'another.valid@example.com' },
                ],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.guestUsers[0].hasEmailRegexError).toBe(false);
            expect(result.guestUsers[1].hasEmailRegexError).toBe(false);
        });

        it('should flag invalid guest user emails', () => {
            const incidentInfo = {
                incidentName: 'Valid Name',
                cloudStorageLink: '',
                guestUsers: [
                    { email: 'invalid-email' },
                    { email: 'no@domain' },
                    { email: 'spaces in@email.com' },
                ],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.guestUsers[0].hasEmailRegexError).toBe(true);
            expect(result.guestUsers[1].hasEmailRegexError).toBe(true);
            expect(result.guestUsers[2].hasEmailRegexError).toBe(true);
        });

        it('should not flag empty email addresses', () => {
            const incidentInfo = {
                incidentName: 'Valid Name',
                cloudStorageLink: '',
                guestUsers: [
                    { email: '' },
                    { email: '   ' },
                ],
            };

            const result = service.regexValidation(incidentInfo, false);

            expect(result.guestUsers[0].hasEmailRegexError).toBe(false);
        });
    });

    describe('getDropdownOptions', () => {
        it('should format dropdown options for non-status lists', async () => {
            const mockData = {
                value: [
                    { fields: { Title: 'Option 1' } },
                    { fields: { Title: 'Option 2' } },
                    { fields: { Title: 'Option 3' } },
                ],
            };

            (mockGraph.api as jest.Mock).mockReturnThis();
            (mockGraph.get as jest.Mock).mockResolvedValue(mockData);

            const result = await service.getDropdownOptions(
                '/test/endpoint',
                mockGraph,
                false
            );

            expect(result).toEqual(['Option 1', 'Option 2', 'Option 3']);
        });

        it('should format dropdown options for incident status lists', async () => {
            const mockData = {
                value: [
                    { fields: { Title: 'Planning', id: '1' } },
                    { fields: { Title: 'Active', id: '2' } },
                    { fields: { Title: 'Closed', id: '3' } },
                ],
            };

            (mockGraph.api as jest.Mock).mockReturnThis();
            (mockGraph.get as jest.Mock).mockResolvedValue(mockData);

            const result = await service.getDropdownOptions(
                '/test/endpoint',
                mockGraph,
                true
            );

            expect(result).toEqual([
                { status: 'Planning', id: '1' },
                { status: 'Active', id: '2' },
                { status: 'Closed', id: '3' },
            ]);
        });

        it('should handle errors gracefully', async () => {
            (mockGraph.api as jest.Mock).mockReturnThis();
            (mockGraph.get as jest.Mock).mockRejectedValue(new Error('API Error'));

            const result = await service.getDropdownOptions(
                '/test/endpoint',
                mockGraph,
                false
            );

            expect(result).toBeUndefined();
        });
    });

    describe('sortConfigData', () => {
        it('should sort configuration data by order value', () => {
            const configValues = {
                field1: 3,
                field2: 1,
                field3: 2,
                field4: 0,
            };

            const result = service.sortConfigData(configValues);

            const keys = Object.keys(result);
            expect(keys).toEqual(['field2', 'field3', 'field1']);
        });

        it('should filter out zero values', () => {
            const configValues = {
                field1: 2,
                field2: 0,
                field3: 1,
            };

            const result = service.sortConfigData(configValues);

            expect(result).toEqual({
                field3: 1,
                field1: 2,
            });
        });

        it('should handle empty object', () => {
            const result = service.sortConfigData({});
            expect(result).toEqual({});
        });
    });

    describe('getPageHeight', () => {
        it('should calculate page height correctly', () => {
            const itemHeight = 50;
            const numberOfItems = 5;

            const result = service.getPageHeight(0, itemHeight, numberOfItems);

            expect(result).toBe(250); // 50 * 5
        });

        it('should handle undefined index as 0', () => {
            const itemHeight = 40;
            const numberOfItems = 3;

            const result = service.getPageHeight(undefined, itemHeight, numberOfItems);

            expect(result).toBe(120); // 40 * 3
        });

        it('should calculate from specific index', () => {
            const itemHeight = 30;
            const numberOfItems = 4;
            const startIndex = 2;

            const result = service.getPageHeight(startIndex, itemHeight, numberOfItems);

            expect(result).toBe(120); // 30 * 4
        });
    });
});

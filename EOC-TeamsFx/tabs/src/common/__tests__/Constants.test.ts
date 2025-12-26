import * as constants from '../Constants';

describe('Constants', () => {
    describe('getTeamsWebUrl', () => {
        it('should return commercial Teams URL for commercial environment', () => {
            const result = constants.getTeamsWebUrl(constants.defaultGraphBaseURL);
            expect(result).toBe(constants.teamsWebUrl);
        });

        it('should return commercial Teams URL for commercial environment with explicit commercial cloud type', () => {
            const result = constants.getTeamsWebUrl(
                constants.defaultGraphBaseURL,
                constants.cloudEnvironments.Commercial
            );
            expect(result).toBe(constants.teamsWebUrl);
        });

        it('should return GCCH Teams URL for government cloud without explicit cloud type', () => {
            const result = constants.getTeamsWebUrl('https://graph.microsoft.us/');
            expect(result).toBe(constants.teamsWebUrlGCCH);
        });

        it('should return GCCH Teams URL for GCCH environment', () => {
            const result = constants.getTeamsWebUrl(
                'https://graph.microsoft.us/',
                constants.cloudEnvironments.GCCH
            );
            expect(result).toBe(constants.teamsWebUrlGCCH);
        });

        it('should return DOD Teams URL for DOD environment', () => {
            const result = constants.getTeamsWebUrl(
                'https://graph.microsoft.us/',
                constants.cloudEnvironments.DOD
            );
            expect(result).toBe(constants.teamsWebUrlDoD);
        });

        it('should default to GCCH for government cloud with unknown cloud type', () => {
            const result = constants.getTeamsWebUrl(
                'https://graph.microsoft.us/',
                'UnknownCloud'
            );
            expect(result).toBe(constants.teamsWebUrlGCCH);
        });

        it('should return commercial Teams URL for non-government graph URL', () => {
            const result = constants.getTeamsWebUrl('https://graph.example.com/');
            expect(result).toBe(constants.teamsWebUrl);
        });
    });

    describe('cloud environment constants', () => {
        it('should have correct cloud environment types', () => {
            expect(constants.cloudEnvironments.Commercial).toBe('Commercial');
            expect(constants.cloudEnvironments.GCCH).toBe('GCCH');
            expect(constants.cloudEnvironments.DOD).toBe('DOD');
        });
    });

    describe('Teams web URLs', () => {
        it('should have correct Teams web URLs for each cloud', () => {
            expect(constants.teamsWebUrl).toBe('https://teams.microsoft.com');
            expect(constants.teamsWebUrlGCCH).toBe('https://gov.teams.microsoft.us');
            expect(constants.teamsWebUrlDoD).toBe('https://dod.teams.microsoft.us');
        });
    });
});

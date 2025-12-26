/**
 * Type definitions for Microsoft Graph API responses
 * Replaces 'any' types with proper TypeScript interfaces
 */

/**
 * Generic Graph API list response
 */
export interface GraphListResponse<T> {
    value: T[];
    '@odata.nextLink'?: string;
    '@odata.count'?: number;
}

/**
 * Graph API user object
 */
export interface GraphUser {
    id: string;
    displayName: string;
    userPrincipalName: string;
    mail?: string;
    jobTitle?: string;
    officeLocation?: string;
}

/**
 * Graph API created/modified by object
 */
export interface GraphUserInfo {
    user: {
        id: string;
        displayName?: string;
        email?: string;
    };
}

/**
 * SharePoint list item fields
 */
export interface SharePointListItemFields {
    id: string;
    Title?: string;
    [key: string]: any; // Additional dynamic fields
}

/**
 * SharePoint list item with typed fields
 */
export interface SharePointListItem<T extends SharePointListItemFields = SharePointListItemFields> {
    id: string;
    fields: T;
    createdBy?: GraphUserInfo;
    lastModifiedBy?: GraphUserInfo;
    createdDateTime?: string;
    lastModifiedDateTime?: string;
}

/**
 * Incident list item fields from SharePoint
 */
export interface IncidentListItemFields extends SharePointListItemFields {
    id: string;
    IncidentId: string;
    IncidentName: string;
    IncidentCommander: string;
    Status: string;
    StatusLookupId?: string;
    Location: string;
    StartDateTime: string;
    Modified: string;
    TeamWebURL?: string;
    Description?: string;
    IncidentType?: string;
    RoleAssignment?: string;
    RoleLeads?: string;
    Severity?: string;
    PlanID?: string;
    BridgeID?: string;
    BridgeLink?: string;
    NewsTabLink?: string;
    CloudStorageLink?: string;
    ReasonForUpdate?: string;
}

/**
 * Role default item fields
 */
export interface RoleDefaultItemFields extends SharePointListItemFields {
    Title: string;
    Users: string;
    RoleLead?: string;
}

/**
 * Incident type default fields
 */
export interface IncidentTypeDefaultFields extends SharePointListItemFields {
    Title: string;
    RoleAssignment?: string;
    RoleLeads?: string;
    AdditionalChannels?: string;
    SharedChannel?: string;
    CloudStorageLink?: string;
}

/**
 * Config settings item fields
 */
export interface ConfigSettingsFields extends SharePointListItemFields {
    Title: string;
    Value: string;
}

/**
 * Teams channel object
 */
export interface TeamsChannel {
    id: string;
    displayName: string;
    description?: string;
    webUrl?: string;
    membershipType?: 'standard' | 'private' | 'shared';
}

/**
 * Teams tab object
 */
export interface TeamsTab {
    id: string;
    displayName: string;
    webUrl?: string;
    configuration?: {
        entityId?: string;
        contentUrl?: string;
        removeUrl?: string;
        websiteUrl?: string;
    };
}

/**
 * Teams member object
 */
export interface TeamsMember {
    id: string;
    displayName?: string;
    userId?: string;
    email?: string;
    roles?: string[];
}

/**
 * Planner plan object
 */
export interface PlannerPlan {
    id: string;
    title: string;
    owner: string;
    createdDateTime?: string;
}

/**
 * Planner bucket object
 */
export interface PlannerBucket {
    id: string;
    name: string;
    planId: string;
    orderHint?: string;
}

/**
 * Planner task object
 */
export interface PlannerTask {
    id: string;
    planId: string;
    bucketId: string;
    title: string;
    assignments?: Record<string, any>;
    percentComplete?: number;
    startDateTime?: string;
    dueDateTime?: string;
}

/**
 * Graph API error response
 */
export interface GraphError {
    statusCode?: number;
    code?: string;
    message: string;
    requestId?: string;
    date?: string;
    body?: string;
}

/**
 * Site information from Graph API
 */
export interface GraphSite {
    id: string;
    displayName: string;
    name: string;
    webUrl: string;
    siteCollection?: {
        hostname: string;
    };
}

/**
 * Tenant information
 */
export interface TenantInfo {
    id: string;
    displayName: string;
    verifiedDomains?: Array<{
        name: string;
        isDefault: boolean;
    }>;
}

/**
 * Type guard to check if error is a GraphError
 */
export function isGraphError(error: any): error is GraphError {
    return (
        error &&
        typeof error === 'object' &&
        'message' in error
    );
}

/**
 * Type guard to check if response is a GraphListResponse
 */
export function isGraphListResponse<T>(response: any): response is GraphListResponse<T> {
    return (
        response &&
        typeof response === 'object' &&
        Array.isArray(response.value)
    );
}

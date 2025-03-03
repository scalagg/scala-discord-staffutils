declare namespace Redis {
    interface UuidCache {
        'DataStore:UuidCache:Username': {
            [username: string]: string;  // username -> uuid mapping
        };
    }
} 
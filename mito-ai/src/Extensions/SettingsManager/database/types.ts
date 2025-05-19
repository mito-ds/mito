export interface DBConnection {
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
}

export interface DBConnections {
    [key: string]: DBConnection;  // key is now UUID
}

export interface NewConnectionForm {
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
} 
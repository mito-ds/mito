export interface DBConnection {
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
}

export interface DBConnections {
    [key: string]: DBConnection;
}

export interface NewConnectionForm {
    name: string;
    type: string;
    username: string;
    password: string;
    account: string;
    warehouse: string;
} 
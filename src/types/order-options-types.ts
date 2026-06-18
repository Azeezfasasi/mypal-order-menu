export interface OrderOptions {
    order_options: {
        id: string;
        name: string;
        description: string;
        status: boolean
    }[]
}

export interface AddOrderOptionDTO {
    order_options: {id: string, status: boolean}[]
}
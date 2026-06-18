export interface IGetBusinessConversationsParam {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    business_id?: string;
}

export interface IConversationData {
    id: number,
    adminId: string,
    businessId: string,
    status: string,
    createdAt: string,
    updatedAt: string,
    admin: {
        id: string,
        name: string
    },
    latestMessage: {
        id: number,
        message: string,
        messageType: string,
        createdAt: string,
        senderName: string
    },
    unreadCount: number
}

// Response for GET ALL BUSINESS CONVERSATIONS 
export interface IGetAllBusinessConversationsResponse {
    status: string,
    statusCode: number,
    message: string,
    data: {
        data: IConversationData[],
        total: number,
        page: number,
        limit: number,
        totalPages: number,
        hasPrevious: boolean,
        hasNext: boolean,
    }
}

interface IMessage {
    id: number,
    conversationId: number,
    userType: string,
    senderId: string,
    status: string,
    messageType: string,
    message: string,
    createdAt: string,
    senderName: string
}


// Response for GET CONVERSATION DETAILS
export interface IGetConversationDetails {
    status: string,
    statusCode: number,
    message: string,
    data: {
        id: number,
        adminId: string,
        businessId: string,
        status: string,
        createdAt: string,
        updatedAt: string,
        admin: {
            id: string,
            name: string
        },
        business: {
            id: string,
            business_name: string
        },
        messages: IMessage[]
    }
}

// Payload to send messages
export interface ISendMessagePayload {
    messageType: string;
    message: string;
}

// send message response
export interface ISendMessageResponse {
    status: string,
    statusCode: number,
    message: string,
}

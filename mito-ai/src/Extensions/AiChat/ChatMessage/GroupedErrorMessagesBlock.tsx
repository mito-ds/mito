import React from "react"
import { getContentStringFromMessage } from "../../../utils/strings"
import { IDisplayOptimizedChatItem } from "../ChatHistoryManager"

interface IGroupedErrorMessagesProps {
    displayOptimizedChat: IDisplayOptimizedChatItem[]
}

export default function GroupedErrorMessagesBlock({ displayOptimizedChat }: IGroupedErrorMessagesProps) {
    return (
        <div style={{backgroundColor: 'red', padding: '10px'}}>
            {displayOptimizedChat.map((message, index) => {
                return (
                    <div key={index}>
                        {getContentStringFromMessage(message.message)}
                    </div>
                )
            })}
        </div>
    )
}
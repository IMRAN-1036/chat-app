/**
 * Virtual Message List Component
 * Uses react-window for efficient rendering of large message lists
 * Improves performance by only rendering visible messages
 */

import React, { useMemo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { UI_CONSTANTS } from '../constants';

/**
 * Message item renderer for virtual list
 * @param {Object} props - Props object
 * @param {number} props.index - Item index
 * @param {Object} props.style - Style object from react-window
 * @param {Array} props.data - Message data array
 * @returns {JSX.Element} Rendered message item
 */
const MessageItemRenderer = ({ index, style, data }) => {
  const message = data[index];
  
  if (!message) {
    return <div style={style} />;
  }

  return (
    <div style={style} className="virtual-message-wrapper">
      <div className="message-item">
        <div className="message-header">
          <span className="message-sender">{message.sender}</span>
          <span className="message-time">{message.timestamp}</span>
        </div>
        <div className="message-content">
          {message.text}
        </div>
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, idx) => (
              <span key={idx} className="reaction-badge">
                {reaction.emoji} {reaction.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Virtual Message List Component
 * Renders large lists of messages efficiently
 * @param {Object} props - Component props
 * @param {Array} props.messages - Array of message objects
 * @param {number} props.height - Height of the list container
 * @param {Function} props.onReact - Callback for message reactions
 * @param {Function} props.onReply - Callback for message replies
 * @param {Function} props.onLoadMore - Callback to load more messages
 * @returns {JSX.Element} Virtual message list
 */
const VirtualMessageList = React.memo(({
  messages = [],
  height = 600,
  width = '100%',
  onReact,
  onReply,
  onLoadMore,
}) => {
  // Memoize item data to prevent unnecessary re-renders
  const itemData = useMemo(() => messages, [messages]);

  // Handle scroll events for infinite scroll
  const handleScroll = useCallback(({ scrollOffset, scrollUpdateWasRequested }) => {
    if (!scrollUpdateWasRequested && scrollOffset === 0 && onLoadMore) {
      onLoadMore();
    }
  }, [onLoadMore]);

  // Handle item key to improve performance
  const itemKey = useCallback((index, data) => {
    return data[index]?._id || `message-${index}`;
  }, []);

  return (
    <div className="virtual-message-list-container">
      {messages.length === 0 ? (
        <div className="empty-message-list">
          <p>No messages yet. Start the conversation!</p>
        </div>
      ) : (
        <FixedSizeList
          height={height}
          itemCount={messages.length}
          itemSize={UI_CONSTANTS.MESSAGE_ITEM_HEIGHT}
          width={width}
          itemData={itemData}
          itemKey={itemKey}
          onScroll={handleScroll}
          overscanCount={5}
        >
          {MessageItemRenderer}
        </FixedSizeList>
      )}
    </div>
  );
});

VirtualMessageList.displayName = 'VirtualMessageList';

export default VirtualMessageList;

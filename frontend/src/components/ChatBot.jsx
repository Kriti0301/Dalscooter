import React, { useEffect } from 'react';

const ChatBot = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/dialogflow-console/fast/messenger/bootstrap.js?v=1';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <df-messenger
      intent="WELCOME"
      chat-title="DALScooterAssistant"
      agent-id="27f2dacb-b6c8-4279-9570-3630fd6a6862"
      language-code="en"
    ></df-messenger>
  );
};

export default ChatBot;

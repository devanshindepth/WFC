import Chat from './chat';

const ChatSection = () => (
  <div id="chat" className="feature">
    <div className="feature-content">
      <div className="feature-content-wrapper">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-baskerville font-bold text-gray-900 mb-6 text-center">Chat with LegalPal</h1>
          <p className="feature-description">Have questions about legal terms? Chat with our AI legal assistant for clear, friendly explanations.</p>
          <div className="mt-10 w-full max-w-3xl">
            <Chat />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ChatSection;
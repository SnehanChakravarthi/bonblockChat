import { SetStateAction, useEffect, useRef, useState } from 'react';
import Login from './Login';
const apiUrl = import.meta.env.VITE_API_BASE_URL;

interface ApiDataItem {
  label: string;
  event: string;
  range: Array<{
    today?: TimeFrameData;
    last7days?: TimeFrameData;
    last30days?: TimeFrameData;
  }>;
}

interface TimeFrameData {
  fromDate: string;
  toDate: string;
  data: number | null;
  ftlData: any;
}

interface Message {
  text: string;
  sender: 'user' | 'bot';
}

const categories = [
  { key: 'SHIPMENTS', text: 'Show me info about Shipments' },
  { key: 'RECEIPTS', text: 'Show me info about receipts' },
  { key: 'RETURNS', text: 'Show me info about returns' },
];

const timeFrames = [
  { key: 'today', text: 'Show me for today' },
  { key: 'last7days', text: 'Show me for last 7 days' },
  { key: 'last30days', text: 'Show me for last 30 days' },
];

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string>('');
  const [hasBotGreeted, setHasBotGreeted] = useState<boolean>(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<number>(1);
  const [category, setCategory] = useState<string>('');
  const [timeFrame, setTimeFrame] = useState<string>('');
  const [apiData, setApiData] = useState<ApiDataItem[]>([]);
  const [emailDataDetails, setEmailDataDetails] = useState<string[]>([]);

  const handleCategorySelect = (selectedCategoryKey: string) => {
    const categoryText =
      categories.find((c) => c.key === selectedCategoryKey)?.text || '';

    setCategory(selectedCategoryKey);
    console.log(categoryText);
    setMessages((prev) => [
      ...prev,
      { text: categoryText, sender: 'user' },
      { text: 'Choose the time range', sender: 'bot' },
    ]);
    fetchData(selectedCategoryKey);
    setStep(2);
  };

  const handleTimeFrameSelect = (selectedTimeFrameKey: string) => {
    setTimeFrame(selectedTimeFrameKey);
    const timeFrameText =
      timeFrames.find((t) => t.key === selectedTimeFrameKey)?.text || '';

    // Assuming 'category' state is set to something like 'SHIPMENTS' and you want it more readable
    const readableCategory =
      categories
        .find((c) => c.key === category)
        ?.text.replace('Show me info about ', '') || category;

    // Adjusting the time frame text for the intro message
    const readableTimeFrame = timeFrameText.replace('Show me for ', '');

    const introMessage = `Here are the ${readableCategory} data for ${readableTimeFrame}`;

    setMessages((prev) => [
      ...prev,
      { text: timeFrameText, sender: 'user' },
      { text: introMessage, sender: 'bot' },
    ]);

    addDataMessages(selectedTimeFrameKey);
    setStep(3);
  };

  const addDataMessages = (apiDataKey: string) => {
    const relevantDataMessages = apiData.flatMap((item) =>
      item.range.flatMap((range) => {
        const timeData = range[apiDataKey as keyof typeof range];
        if (!timeData) return [];

        const messageText = `${item.label}, Data: ${
          timeData.data ?? 'No data'
        }`;
        return [{ text: messageText, sender: 'bot' as 'user' | 'bot' }];
      })
    );

    setMessages((prevMessages) => [...prevMessages, ...relevantDataMessages]);
    const emailContent = relevantDataMessages.map((message) => message.text);
    setEmailDataDetails(emailContent);
  };

  const fetchData = async (selectedCategoryKey: string) => {
    const stats =
      categories.find((c) => c.key === selectedCategoryKey)?.key || 'SHIPMENTS';

    try {
      const response = await fetch(
        `https://liq-traceability.bonbloc.in/api/v1/vitalStatsData/getCteStats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            networkId: 623,
            stats: stats,
            ftl: false,
          }),
        }
      );

      const data = await response.json();
      setApiData(data);
      console.log(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const goBack = () => {
    if (step === 2) {
      setTimeFrame('');
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleChatbotClick = () => {
    setIsChatbotOpen(!isChatbotOpen);
    if (!hasBotGreeted) {
      let botResponse = 'Hi there! How can I help you?';
      setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
      setHasBotGreeted(true);
    }
  };

  const handleLoginSuccess = (token: SetStateAction<string>) => {
    setIsLoggedIn(true);
    setAccessToken(token);
  };

  const handleSendMessage = (newMessage: string) => {
    setMessages([...messages, { text: newMessage, sender: 'user' }]);

    let botResponse = '';
    if (newMessage.toLowerCase().includes('hello')) {
      botResponse = 'Hi there!';
    } else {
      botResponse = "I'm not sure how to respond to that.";
    }

    setMessages((prev) => [...prev, { text: botResponse, sender: 'bot' }]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const generateForEmail = async () => {
    const compiledData = {
      category: category,
      timeFrame: timeFrame,
      dataDetails: emailDataDetails,
    };

    const emailTemplate =
      'Generate a professional email based on the following email. \n\n' +
      'Dear Sir/Madam, \n\nI am writing to inform you that the data for the ' +
      compiledData.category +
      ' for the ' +
      compiledData.timeFrame +
      ' is as follows: \n\n' +
      compiledData.dataDetails.join('\n') +
      '\n\nThank you. \n\nSincerely, \n\nYour Name Here';

    console.log(emailTemplate);

    try {
      const response = await fetch(`${apiUrl}/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: emailTemplate }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log(result.generatedEmail);
      setMessages((prev) => [
        ...prev,
        { text: result.generatedEmail, sender: 'bot' },
      ]);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="fixed bottom-10 right-10">
      <div
        onClick={handleChatbotClick}
        className="rounded-full absolute bottom-0 right-0 cursor-pointer text-yellow-500 border border-yellow-600 z-10 hover:scale-105 shadow-md shadow-black transition-transform duration-100"
      >
        <svg
          width={isChatbotOpen ? '60' : '30'}
          height={isChatbotOpen ? '60' : '30'}
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          className="fill-current transition-all duration-100"
        >
          <path
            fill-rule="evenodd"
            d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16s-7.163 16-16 16m.28-8.675c1.028.711 2.332 1.134 3.744 1.134c.351 0 .698-.026 1.039-.077c.117.048.23.107.369.187c.3.176.701.446 1.2.81c.409.299.988.01.988-.493v-1.461c.21-.136.408-.283.595-.442C25.345 22.025 26 20.715 26 19.31c0-.925-.28-1.79-.772-2.537a7.929 7.929 0 0 1-.627 1.53c.104.323.159.66.159 1.007c0 1.034-.488 2.01-1.352 2.742a4.679 4.679 0 0 1-.717.499a.612.612 0 0 0-.311.531v.624c-.593-.38-1-.559-1.31-.559a.627.627 0 0 0-.104.009a5.696 5.696 0 0 1-2.602-.17a11.45 11.45 0 0 1-2.083.34zm-7.466-2.922a9.27 9.27 0 0 0 1.044.765v2.492c0 .63.725.99 1.236.616c1.41-1.03 2.39-1.612 2.635-1.67c.566.09 1.144.135 1.728.135c5.2 0 9.458-3.607 9.458-8.12c0-4.514-4.259-8.121-9.458-8.121S6 10.107 6 14.62c0 2.21 1.03 4.271 2.814 5.783m4.949.666c-.503 0-1.238.355-2.354 1.104v-1.437a.765.765 0 0 0-.39-.664a7.815 7.815 0 0 1-1.196-.833C8.37 18.01 7.55 16.366 7.55 14.62c0-3.61 3.516-6.588 7.907-6.588c4.392 0 7.907 2.978 7.907 6.588s-3.515 6.589-7.907 6.589c-.53 0-1.053-.044-1.564-.13a.784.784 0 0 0-.13-.01m-2.337-4.916c.685 0 1.24-.55 1.24-1.226c0-.677-.555-1.226-1.24-1.226c-.685 0-1.24.549-1.24 1.226c0 .677.555 1.226 1.24 1.226m4.031 0c.685 0 1.24-.55 1.24-1.226c0-.677-.555-1.226-1.24-1.226c-.685 0-1.24.549-1.24 1.226c0 .677.555 1.226 1.24 1.226m4.031 0c.685 0 1.24-.55 1.24-1.226c0-.677-.555-1.226-1.24-1.226c-.685 0-1.24.549-1.24 1.226c0 .677.555 1.226 1.24 1.226"
          />
        </svg>
      </div>
      {!isChatbotOpen && (
        <div className="h-[80vh] rounded-2xl border-yellow-500 text-sm shadow-md shadow-yellow-800/40 mb-10 w-96 border absolute bottom-0 right-0 flex flex-col overflow-hidden">
          <div className="bg-yellow-500 h-auto py-1 flex flex-col justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
              className="self-end mr-2 cursor-pointer hover:scale-125 transition-transform duration-100 fill-yellow-800"
              onClick={handleChatbotClick}
            >
              <path d="M208.49 191.51a12 12 0 0 1-17 17L128 145l-63.51 63.49a12 12 0 0 1-17-17L111 128L47.51 64.49a12 12 0 0 1 17-17L128 111l63.51-63.52a12 12 0 0 1 17 17L145 128Z" />
            </svg>
          </div>
          {!isLoggedIn ? (
            <div className="w-full bg-yellow-50 flex-col h-full flex justify-center items-center ">
              Please login to continue
              <Login onLoginSuccess={handleLoginSuccess} />
            </div>
          ) : (
            <>
              <div className="bg-yellow-50 transition-all duration-100 ">
                <div className="h-[60vh] p-4 overflow-scroll space-y-3 flex flex-col ">
                  {messages.map((msg, index) =>
                    msg.sender === 'bot' ? (
                      <div key={index} className="w-4/5">
                        <p className="px-2 py-1 bg-yellow-400 border w-fit border-yellow-500 rounded-lg text-pretty whitespace-pre">
                          {msg.text}
                        </p>
                      </div>
                    ) : (
                      <div
                        key={index}
                        className="w-4/5 self-end flex justify-end"
                      >
                        <p className="px-2  py-1 bg-white border border-neutral-300 rounded-lg w-fit">
                          {msg.text}
                        </p>
                      </div>
                    )
                  )}
                  <div ref={messagesEndRef} />
                </div>
                <div className="px-4 py-2 space-y-1 bg-white transition-all duration-100 border-t w-full flex flex-col items-end *:cursor-pointer ">
                  <div>
                    {step === 1 && (
                      <div className="space-y-1 w-full flex flex-col">
                        {categories.map((category) => (
                          <button
                            key={category.key}
                            onClick={() => handleCategorySelect(category.key)}
                            className="border self-end  px-2 py-1 bg-yellow-50 text-black border-neutral-300 rounded-lg  transition-all duration-100 hover:font-semibold"
                          >
                            {category.text}
                          </button>
                        ))}
                      </div>
                    )}
                    {step === 2 && (
                      <div className="space-y-1 w-full flex flex-col">
                        {timeFrames.map((timeFrame) => (
                          <button
                            key={timeFrame.key}
                            onClick={() => handleTimeFrameSelect(timeFrame.key)}
                            className="border self-end  px-2 py-1 bg-yellow-50 text-black border-neutral-300 rounded-lg  transition-all duration-100 hover:font-semibold"
                          >
                            {timeFrame.text}
                          </button>
                        ))}
                        <button
                          onClick={goBack}
                          className="border self-end  px-2 py-1 bg-yellow-50 text-black border-neutral-300 rounded-lg  transition-all duration-100 hover:font-semibold"
                        >
                          Go Back
                        </button>
                      </div>
                    )}
                    {step === 3 && (
                      <div className="space-y-1 w-full flex flex-col">
                        <button
                          className="border self-end px-2 py-1 bg-yellow-50 text-black border-neutral-300 rounded-lg  transition-all duration-100 hover:font-semibold"
                          onClick={() => generateForEmail()}
                        >
                          Generate Email
                        </button>
                        <button
                          onClick={goBack}
                          className="border self-end  px-2 py-1 bg-yellow-50 text-black border-neutral-300 rounded-lg  transition-all duration-100 hover:font-semibold"
                        >
                          Go Back
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* <div className="flex flex-row justify-between w-full h-20 border-t">
                <textarea
                  className="p-2 h-full w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const target = e.target as HTMLInputElement;
                      handleSendMessage(target.value);
                      target.value = '';
                    }
                  }}
                />
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  className="self-center mr-2  z-20"
                >
                  <path
                    fill="#9C9F9F"
                    fill-rule="evenodd"
                    d="M2.345 2.245a1 1 0 0 1 1.102-.14l18 9a1 1 0 0 1 0 1.79l-18 9a1 1 0 0 1-1.396-1.211L4.613 13H10a1 1 0 1 0 0-2H4.613L2.05 3.316a1 1 0 0 1 .294-1.071z"
                    clip-rule="evenodd"
                  />
                </svg>
              </div> */}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

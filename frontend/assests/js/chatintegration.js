 // Mock chat data
    const users = [
      {
        name: "Maria", messages: [
          { text: "Hey, did you check the new design?", type: "received" },
          { text: "Yes! It looks great. Adding minor updates now.", type: "sent" }
        ]
      },
      {
        name: "Joshi", messages: [
          { text: "Meeting at 4 PM?", type: "received" },
          { text: "Sure, I’ll be there.", type: "sent" }
        ]
      },
      {
        name: "Ankit", messages: [
          { text: "Can you review my PR?", type: "received" }
        ]
      }
    ];

    let activeUserIndex = 0;

    const chatList = document.getElementById("chatList");
    const chatMessages = document.getElementById("chatMessages");
    const messageInput = document.getElementById("messageInput");

    function renderChatList() {
      chatList.innerHTML = "";
      const term = document.getElementById("searchUser").value.toLowerCase();
      users.filter(u => u.name.toLowerCase().includes(term)).forEach((u, i) => {
        const item = document.createElement("div");
        item.className = "chat-list-item " + (i === activeUserIndex ? "active" : "");
        item.innerHTML = `<h6>${u.name}</h6><small>${u.messages.slice(-1)[0]?.text || "No messages yet"}</small>`;
        item.onclick = () => { activeUserIndex = i; renderChats(); renderChatList(); };
        chatList.appendChild(item);
      });
    }

    function renderChats() {
      const u = users[activeUserIndex];
      chatMessages.innerHTML = "";
      u.messages.forEach(m => {
        const div = document.createElement("div");
        div.className = "message " + m.type;
        div.textContent = m.text;
        chatMessages.appendChild(div);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    document.getElementById("sendBtn").addEventListener("click", sendMessage);
    messageInput.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

    function sendMessage() {
      const text = messageInput.value.trim();
      if (!text) return;
      users[activeUserIndex].messages.push({ text, type: "sent" });
      renderChats();
      messageInput.value = "";
      setTimeout(() => {
        users[activeUserIndex].messages.push({ text: "Got it 👍", type: "received" });
        renderChats();
      }, 1000);
    }

    document.getElementById("searchUser").addEventListener("input", renderChatList);

    renderChatList();
    renderChats();
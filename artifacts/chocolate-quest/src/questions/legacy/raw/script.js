const questions = [
    { question: "What does CPU stand for?", options: ["Central Processing Unit", "Central Power Unit", "Control Processing Unit", "Central Performance Unit"], answer: "Central Processing Unit" },
    { question: "Which language is primarily used for web development?", options: ["Python", "JavaScript", "C++", "Java"], answer: "JavaScript" },
    { question: "What is the main function of RAM?", options: ["Permanent storage", "Temporary data storage", "Backup storage", "Input processing"], answer: "Temporary data storage" },
    { question: "Which operating system is known as open-source?", options: ["Windows", "macOS", "Linux", "iOS"], answer: "Linux" },
    { question: "What does GUI stand for?", options: ["Graphical User Interface", "Graphical Unified Interface", "General User Interface", "Generalized User Interface"], answer: "Graphical User Interface" },
    { question: "Which device is used to input text?", options: ["Monitor", "Keyboard", "Printer", "Speaker"], answer: "Keyboard" },
    { question: "What is the main function of an operating system?", options: ["Run applications", "Manage hardware", "Provide security", "All of the above"], answer: "All of the above" },
    { question: "What does HTML stand for?", options: ["HyperText Markup Language", "HyperText Markdown Language", "HighText Markup Language", "HyperLink and Text Markup Language"], answer: "HyperText Markup Language" },
    { question: "Which of the following is a database management system?", options: ["MySQL", "HTML", "Python", "JavaScript"], answer: "MySQL" },
    { question: "What is the primary function of a firewall?", options: ["Speed up the internet", "Block unauthorized access", "Store data", "Process applications"], answer: "Block unauthorized access" },
    { question: "Which protocol is used for sending emails?", options: ["FTP", "HTTP", "SMTP", "IMAP"], answer: "SMTP" },
    { question: "What is a virus in computer terms?", options: ["A type of software", "A hardware issue", "A type of malware", "None of the above"], answer: "A type of malware" },
    { question: "What does SSD stand for?", options: ["Solid State Drive", "Static Storage Device", "Solid State Data", "Simple Storage Drive"], answer: "Solid State Drive" },
    { question: "Which of the following is NOT an operating system?", options: ["Windows", "Linux", "Android", "HTML"], answer: "HTML" },
    { question: "What is the purpose of a web browser?", options: ["Create websites", "Access the internet", "Store files", "Design graphics"], answer: "Access the internet" },
    { question: "Which one is a programming language?", options: ["HTML", "CSS", "JavaScript", "All of the above"], answer: "JavaScript" },
    { question: "What does VPN stand for?", options: ["Virtual Private Network", "Virtual Protected Network", "Variable Public Network", "Virtual Public Network"], answer: "Virtual Private Network" },
    { question: "What is the purpose of a compiler?", options: ["Convert source code to machine code", "Run the program", "Debug errors", "None of the above"], answer: "Convert source code to machine code" },
    { question: "What is an IP address?", options: ["A unique identifier for a device on a network", "A type of malware", "A programming language", "A web browser"], answer: "A unique identifier for a device on a network" },
    { question: "Which of the following is an example of an input device?", options: ["Monitor", "Printer", "Scanner", "Projector"], answer: "Scanner" },
    { question: "What does SQL stand for?", options: ["Structured Query Language", "Simple Query Language", "Structured Question Language", "Standard Query Language"], answer: "Structured Query Language" },
    { question: "Which of the following is a cloud storage service?", options: ["Dropbox", "Photoshop", "Excel", "None of the above"], answer: "Dropbox" },
    { question: "What does URL stand for?", options: ["Uniform Resource Locator", "Universal Resource Locator", "Unique Resource Locator", "Unified Resource Locator"], answer: "Uniform Resource Locator" },
    { question: "What is phishing?", options: ["A type of fishing", "A way to hack accounts", "A programming language", "A security feature"], answer: "A way to hack accounts" },
    { question: "What is the main purpose of a hard drive?", options: ["Temporary storage", "Permanent storage", "Input processing", "Output processing"], answer: "Permanent storage" },
    { question: "What does ASCII stand for?", options: ["American Standard Code for Information Interchange", "Advanced Standard Code for Information Interchange", "American Standard Code for Internet Interchange", "All-purpose Standard Code for Information Interchange"], answer: "American Standard Code for Information Interchange" },
    { question: "Which language is used for styling web pages?", options: ["HTML", "CSS", "JavaScript", "PHP"], answer: "CSS" },
    { question: "What is an algorithm?", options: ["A programming language", "A step-by-step procedure for solving a problem", "A type of software", "A hardware component"], answer: "A step-by-step procedure for solving a problem" },
    { question: "What is malware?", options: ["Malicious software", "Helpful software", "Operating system", "None of the above"], answer: "Malicious software" },
    { question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperLink Transfer Protocol", "HyperText Transmission Protocol"], answer: "HyperText Transfer Protocol" },
    { question: "Which of the following is a search engine?", options: ["Google", "Photoshop", "Excel", "PowerPoint"], answer: "Google" },
    { question: "What is the purpose of a modem?", options: ["Convert digital signals to analog", "Store data", "Process graphics", "Run applications"], answer: "Convert digital signals to analog" },
    { question: "What does a motherboard do?", options: ["Connects all hardware components", "Stores data", "Processes graphics", "Runs the operating system"], answer: "Connects all hardware components" },
    { question: "What is the function of a router?", options: ["Connects devices to the internet", "Processes data", "Stores files", "None of the above"], answer: "Connects devices to the internet" },
    { question: "Which of the following is a type of network topology?", options: ["Star", "Tree", "Bus", "All of the above"], answer: "All of the above" },
    { question: "What is a byte?", options: ["A unit of digital information", "A type of software", "A programming language", "None of the above"], answer: "A unit of digital information" },
    { question: "What does the 'ping' command do?", options: ["Tests connectivity to a network", "Measures internet speed", "Downloads files", "None of the above"], answer: "Tests connectivity to a network" },
    { question: "What is the purpose of a backup?", options: ["Store original files", "Create copies of files", "Delete old files", "None of the above"], answer: "Create copies of files" },
    { question: "Which company developed the Windows operating system?", options: ["Apple", "Microsoft", "Linux", "IBM"], answer: "Microsoft" },
    { question: "What does an antivirus program do?", options: ["Protects against malware", "Enhances performance", "Optimizes storage", "All of the above"], answer: "Protects against malware" },
    { question: "Which type of software is used to create documents?", options: ["Spreadsheet software", "Word processing software", "Database software", "Presentation software"], answer: "Word processing software" },
    { question: "What is a file extension?", options: ["A part of a file name", "A type of malware", "A programming language", "None of the above"], answer: "A part of a file name" },
    { question: "What is a compiler?", options: ["Translates source code into machine code", "Runs a program", "Manages hardware resources", "None of the above"], answer: "Translates source code into machine code" },
    { question: "Which of the following is NOT a programming paradigm?", options: ["Object-oriented", "Functional", "Procedural", "Text-based"], answer: "Text-based" },
    { question: "What is an IP address used for?", options: ["Identifying devices on a network", "Storing data", "Running programs", "None of the above"], answer: "Identifying devices on a network" },
    { question: "What does GUI stand for?", options: ["Graphical User Interface", "Graphical Universal Interface", "General User Interface", "Generalized User Interface"], answer: "Graphical User Interface" },
    { question: "What is the primary function of the operating system?", options: ["Manage hardware and software resources", "Provide internet access", "Create applications", "None of the above"], answer: "Manage hardware and software resources" },
    { question: "What is a script?", options: ["A sequence of instructions", "A programming language", "A type of malware", "None of the above"], answer: "A sequence of instructions" },
    { question: "Which of the following is a type of software development methodology?", options: ["Agile", "Waterfall", "Scrum", "All of the above"], answer: "All of the above" },
    { question: "What does GPU stand for?", options: ["Graphics Processing Unit", "General Purpose Unit", "Graphics Performance Unit", "General Processing Unit"], answer: "Graphics Processing Unit" },
    { question: "What is the primary purpose of an operating system?", options: ["To manage computer hardware", "To run applications", "To provide user interface", "All of the above"], answer: "All of the above" },
    { question: "Which of the following is a type of malware?", options: ["Virus", "Trojan", "Worm", "All of the above"], answer: "All of the above" },
    { question: "What does DNS stand for?", options: ["Domain Name System", "Domain Network Service", "Dynamic Name System", "Dynamic Network Service"], answer: "Domain Name System" },
    { question: "Which programming language is known for web server scripting?", options: ["Python", "JavaScript", "Ruby", "C++"], answer: "JavaScript" },
    { question: "What is an open-source software?", options: ["Software with source code available", "Software that is free", "Software that is shared", "All of the above"], answer: "All of the above" },
    { question: "Which device converts digital signals to analog?", options: ["Modem", "Router", "Switch", "Hub"], answer: "Modem" },
    { question: "What is the primary function of a router?", options: ["Forward data packets", "Store data", "Connect peripherals", "Encrypt data"], answer: "Forward data packets" },
    { question: "What is phishing?", options: ["A type of fishing", "A way to steal personal information", "A computer virus", "None of the above"], answer: "A way to steal personal information" },
    { question: "What does a database do?", options: ["Stores data", "Processes data", "Both A and B", "None of the above"], answer: "Both A and B" },
    { question: "Which company developed the Linux operating system?", options: ["Microsoft", "Apple", "Linus Torvalds", "IBM"], answer: "Linus Torvalds" },
    { question: "What is the purpose of a VPN?", options: ["To enhance security", "To bypass geographic restrictions", "To encrypt internet traffic", "All of the above"], answer: "All of the above" },
    { question: "Which one is a web server?", options: ["Apache", "MySQL", "PHP", "Java"], answer: "Apache" },
    { question: "What is a URL?", options: ["Uniform Resource Locator", "Universal Resource Locator", "Unique Resource Locator", "Unified Resource Locator"], answer: "Uniform Resource Locator" },
    { question: "What is the primary function of an antivirus?", options: ["Protects against malware", "Increases internet speed", "Manages network traffic", "None of the above"], answer: "Protects against malware" },
    { question: "Which of the following is a markup language?", options: ["HTML", "CSS", "JavaScript", "Python"], answer: "HTML" },
    { question: "What is the function of a hard disk drive?", options: ["Data storage", "Data processing", "Data input", "Data output"], answer: "Data storage" },
    { question: "Which of the following is a client-side scripting language?", options: ["PHP", "JavaScript", "Ruby", "Python"], answer: "JavaScript" },
    { question: "What is the main purpose of the task manager?", options: ["Monitor system performance", "Run applications", "Manage files", "None of the above"], answer: "Monitor system performance" },
    { question: "What does the term 'cloud computing' refer to?", options: ["Using remote servers for storage and processing", "Storing data on local drives", "Networking computers", "None of the above"], answer: "Using remote servers for storage and processing" },
    { question: "What is a DDoS attack?", options: ["Distributed Denial of Service", "Dynamic Data Service", "Distributed Data Storage", "None of the above"], answer: "Distributed Denial of Service" },
    { question: "Which language is primarily used for data analysis?", options: ["JavaScript", "SQL", "HTML", "CSS"], answer: "SQL" },
    { question: "What is a binary code?", options: ["A way to represent data using 0s and 1s", "A type of programming language", "A form of database", "None of the above"], answer: "A way to represent data using 0s and 1s" },
    { question: "What does a compiler do?", options: ["Translates code into machine language", "Runs programs", "Stores data", "None of the above"], answer: "Translates code into machine language" },
    { question: "Which of the following is NOT a programming language?", options: ["Java", "Python", "HTML", "C++"], answer: "HTML" },
    { question: "What is a software bug?", options: ["An error in the code", "A type of hardware", "A virus", "None of the above"], answer: "An error in the code" },
    { question: "What is a phishing attack?", options: ["An attempt to trick users into giving personal information", "A type of computer virus", "A network attack", "None of the above"], answer: "An attempt to trick users into giving personal information" },
    { question: "Which of the following is a feature of cloud storage?", options: ["Accessibility from anywhere", "Automatic backups", "Scalability", "All of the above"], answer: "All of the above" },
    { question: "What is a web crawler?", options: ["A program that indexes web pages", "A type of malware", "A web browser", "None of the above"], answer: "A program that indexes web pages" },
    { question: "What is an algorithm?", options: ["A set of rules or steps for solving a problem", "A programming language", "A type of software", "None of the above"], answer: "A set of rules or steps for solving a problem" },
    { question: "What does RAM stand for?", options: ["Random Access Memory", "Read Access Memory", "Rapid Access Memory", "None of the above"], answer: "Random Access Memory" },
    { question: "What is a spreadsheet?", options: ["A software for data organization", "A type of document", "A programming tool", "None of the above"], answer: "A software for data organization" },
    { question: "Which of the following is a popular database?", options: ["MySQL", "HTML", "JavaScript", "CSS"], answer: "MySQL" },
    { question: "What does HTTP stand for?", options: ["HyperText Transfer Protocol", "HyperText Transmission Protocol", "HyperLink Transfer Protocol", "None of the above"], answer: "HyperText Transfer Protocol" },
    { question: "What is the primary purpose of a firewall?", options: ["To block unauthorized access", "To speed up internet connections", "To store data", "None of the above"], answer: "To block unauthorized access" },
    { question: "Which of the following is an example of an operating system?", options: ["Windows", "Python", "HTML", "SQL"], answer: "Windows" },
    { question: "What is the main function of a keyboard?", options: ["Input data", "Output data", "Store data", "None of the above"], answer: "Input data" },
    { question: "Which of the following is a search engine?", options: ["Google", "YouTube", "Facebook", "Twitter"], answer: "Google" },
    { question: "What is the purpose of a network switch?", options: ["Connects devices within a network", "Processes data", "Stores data", "None of the above"], answer: "Connects devices within a network" },
    { question: "What does the term 'big data' refer to?", options: ["Large volumes of data", "Data stored in the cloud", "Data with no structure", "None of the above"], answer: "Large volumes of data" },
    { question: "What is a URL shortener?", options: ["A tool to create shorter links", "A type of malware", "A web browser", "None of the above"], answer: "A tool to create shorter links" },
    { question: "What is a password manager?", options: ["A tool to store passwords securely", "A type of malware", "A web browser", "None of the above"], answer: "A tool to store passwords securely" },
    { question: "What does the 'www' in a website address stand for?", options: ["World Wide Web", "Web World Wide", "World Web Wide", "None of the above"], answer: "World Wide Web" },
    { question: "What is the function of an operating system?", options: ["Manages computer hardware", "Provides a user interface", "Runs applications", "All of the above"], answer: "All of the above" },
    { question: "What is the main use of CSS?", options: ["Styling web pages", "Creating web applications", "Storing data", "None of the above"], answer: "Styling web pages" },
    { question: "What is the purpose of a data backup?", options: ["To create copies of data for recovery", "To delete old data", "To optimize storage", "None of the above"], answer: "To create copies of data for recovery" },
    { question: "Which of the following is a programming language?", options: ["HTML", "JavaScript", "CSS", "All of the above"], answer: "JavaScript" },
    { question: "What is the purpose of encryption?", options: ["To secure data", "To speed up processing", "To organize data", "None of the above"], answer: "To secure data" },
    { question: "What does SaaS stand for?", options: ["Software as a Service", "System as a Service", "Software as a System", "Service as a Software"], answer: "Software as a Service" },
    { question: "What is a computer network?", options: ["A group of interconnected computers", "A single computer", "A type of software", "None of the above"], answer: "A group of interconnected computers" },
    { question: "What is machine learning?", options: ["A branch of AI that enables systems to learn", "A programming language", "A type of malware", "None of the above"], answer: "A branch of AI that enables systems to learn" }
];

let currentQuestionIndex = 0;
let timerInterval;
let shuffledQuestions = [];
let score = 0; // Initialize score
const totalQuestions = 5; // Total number of questions to ask

const questionElement = document.getElementById('question');
const optionsElement = document.getElementById('options');
const timerElement = document.getElementById('timer');
const restartButton = document.getElementById('restart');
const scoreElement = document.getElementById('score'); // New element for score display

let previouslyAskedIndices = [];

function shuffleAndSelectQuestions() {
    const filteredQuestions = questions.filter((_, index) => !previouslyAskedIndices.includes(index));
    const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
    
    if (shuffled.length < totalQuestions) {
        alert("No more new questions available! Restarting the quiz.");
        previouslyAskedIndices = []; // Reset if not enough questions
        return shuffleAndSelectQuestions();
    }

    shuffledQuestions = shuffled.slice(0, totalQuestions);
    previouslyAskedIndices.push(...shuffledQuestions.map(q => questions.indexOf(q)));
}

function startQuiz() {
    shuffleAndSelectQuestions();
    currentQuestionIndex = 0;
    score = 0; // Reset score
    restartButton.classList.add('hidden');
    scoreElement.innerText = `Score: ${score}`; // Display initial score
    nextQuestion();
}

function nextQuestion() {
    resetTimer();
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    questionElement.innerText = currentQuestion.question;
    optionsElement.innerHTML = '';

    currentQuestion.options.forEach(option => {
        const button = document.createElement('button');
        button.innerText = option;
        button.addEventListener('click', () => selectOption(option));
        optionsElement.appendChild(button);
    });

    startTimer();
}

function selectOption(option) {
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    clearInterval(timerInterval);
    
    if (option === currentQuestion.answer) {
        score++; // Increase score for correct answer
        alert("Correct!");
        document.getElementById("score").style.boxShadow = "0 2px 10px rgb(0, 255, 34)";
    } else {
        alert("Wrong! The correct answer was: " + currentQuestion.answer);
        document.getElementById("score").style.boxShadow = "0 2px 10px rgb(255, 0, 0)";
    }

    scoreElement.innerText = `Score: ${score}`; // Update score display

    currentQuestionIndex++;
    if (currentQuestionIndex < shuffledQuestions.length) {
        nextQuestion();
    } else {
        alert(`Quiz Completed! Your final score is: ${score}/${totalQuestions}`);
        
        // Check for full score
        if (score === totalQuestions) {
            showCelebrationVideo();
        }
        
        restartButton.classList.remove('hidden'); 
    }
}

function showCelebrationVideo() {
    const video = document.getElementById('celebrationVideo');
    video.style.display = 'block'; // Show the video
    video.play(); // Start playing the video

    // Add an event listener to hide the video after it ends
    video.addEventListener('ended', () => {
        video.style.display = 'none'; // Hide the video
    });
}

function startTimer() {
    let timeLeft = 15;
    timerElement.innerText = timeLeft;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerElement.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time's up!");
            selectOption(""); // Handle timeout
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
}

restartButton.addEventListener('click', startQuiz);

// Start the quiz on initial load
startQuiz();

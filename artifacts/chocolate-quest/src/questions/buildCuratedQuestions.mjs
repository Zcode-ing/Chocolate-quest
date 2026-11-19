import { writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  NEW_JUNIOR_QUESTIONS,
  NEW_SEMI_SENIOR_QUESTIONS,
} from "./cbseQuestionsJuniorSemi.mjs";
import {
  NEW_SENIOR_QUESTIONS,
  NEW_ULTRA_ADVANCED_QUESTIONS,
} from "./cbseQuestionsSeniorUltra.mjs";
import {
  EXTRA_JUNIOR_25,
  EXTRA_SEMI_SENIOR_25,
  EXTRA_SENIOR_25,
  EXTRA_ULTRA_ADVANCED_25,
} from "./cbseQuestionsBatch740.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(here, "curatedQuestions.generated.json");

function q(level, topic, difficulty, prompt, answer, distractors, bossEligible = false) {
  const options = [answer, ...distractors];
  if (options.length !== 4) {
    throw new Error(`Expected 4 options for "${prompt}", got ${options.length}`);
  }
  return { level, topic, difficulty, prompt, answer, options, bossEligible };
}

// Each level's 60 questions are balanced across all 4 length ranks (longest, 2nd, 3rd, shortest)
// with tight, natural option lengths so neither "pick longest" nor "pick shortest" gives an edge.
const JUNIOR_QUESTIONS = [
  // 0..14: rank 0 (natural full phrase answer, slightly shorter crisp distractors)
  q("junior", "Hardware", 22, "What does CPU stand for in computing?", "Central Processing Unit", ["Central Power Unit", "Control Program Unit", "Core Process Unit"]),
  q("junior", "Hardware", 24, "Which hardware device converts digital data into printed paper?", "Laser printer", ["Flat scanner", "LCD monitor", "Drawing pad"]),
  q("junior", "Hardware", 21, "Which device lets a user point, click, and drag items on screen?", "Computer mouse", ["Photo scanner", "Label printer", "Studio mic"]),
  q("junior", "Hardware", 25, "What does RAM stand for in a computer system?", "Random Access Memory", ["Read Active Memory", "Rapid Archive RAM", "Remote Access Unit"]),
  q("junior", "Hardware", 28, "What is the primary role of RAM while programs are running?", "Hold active data for fast CPU access", ["Store files forever offline", "Cool the CPU chip safely", "Convert AC wall power"]),
  q("junior", "Hardware", 27, "What does SSD stand for in modern storage drives?", "Solid State Drive", ["Static Disk Unit", "System Fast Disk", "Serial Data Drive"]),
  q("junior", "Hardware", 26, "Which main circuit board connects the CPU, memory, and expansion slots?", "Motherboard", ["Power unit", "Sound card", "Heat sink"]),
  q("junior", "Hardware", 29, "What does GPU stand for in graphics hardware?", "Graphics Processing Unit", ["General Power Utility", "Global Pixel Engine", "Guided Video Unit"]),
  q("junior", "Hardware", 23, "Which device captures physical photos or documents as digital images?", "Flatbed scanner", ["Draft plotter", "Desk speaker", "Slide projector"]),
  q("junior", "Hardware", 24, "Which port standard connects mice, keyboards, and flash drives?", "USB port", ["VGA jack", "RJ11 plug", "AUX jack"]),
  q("junior", "Hardware", 30, "How many bits make up one single byte of digital data?", "8 binary bits", ["4 bits half", "6 bits unit", "2 bits pair"]),
  q("junior", "Hardware", 31, "What are the only two digits used in the binary number system?", "Zero and one", ["One and two", "Zero to nine", "A and B"]),
  q("junior", "Hardware", 32, "Which storage unit is larger than one gigabyte?", "One terabyte", ["One megabyte", "One kilobyte", "One nibble"]),
  q("junior", "Hardware", 28, "Why is an SSD usually faster than a traditional hard disk drive?", "Flash memory has no moving parts", ["Platters spin very fast", "Cables skip motherboard", "Text files stay small"]),
  q("junior", "Hardware", 33, "Which component removes heat from a processor chip?", "Heat sink and fan", ["Disc drive tray", "Coin cell slot", "Wi-Fi antenna"]),

  // 15..29: rank 1 (1 distractor longer, 2 distractors shorter)
  q("junior", "Software", 23, "Which software program is used to view websites on the internet?", "Web browser", ["Spreadsheet formula builder", "Code editor", "Disk tool"]),
  q("junior", "Software", 24, "Which of these is an operating system rather than a web format?", "Linux", ["Hypertext HTML5", "CSS", "JSON"]),
  q("junior", "Software", 25, "What is the core job of an operating system on a PC?", "Manage hardware and run apps", ["Automatically generate website styles", "Bake silicon chips", "Supply wall power"]),
  q("junior", "Software", 22, "Which keyboard shortcut copies selected text on Windows PCs?", "Ctrl + C", ["Ctrl + V (Paste text)", "Ctrl + X", "Ctrl + Z"]),
  q("junior", "Software", 23, "Which keyboard shortcut pastes copied content on Windows PCs?", "Ctrl + V", ["Ctrl + P (Print page)", "Ctrl + S", "Ctrl + F"]),
  q("junior", "Software", 26, "Which type of software organizes numbers in rows and formulas?", "Spreadsheet app", ["Vector graphic design suite", "Audio synth", "Packet app"]),
  q("junior", "Software", 27, "What does a file extension like .pdf or .png indicate?", "The file format type", ["Monitor diagonal screen inches", "Battery percent", "Wi-Fi speed"]),
  q("junior", "Software", 28, "What does GUI stand for in computing interfaces?", "Graphical User Interface", ["General System Utility Integrator", "Guided Upload Tool", "Global User App"]),
  q("junior", "Software", 29, "Which Microsoft Office app is designed primarily for presentations?", "PowerPoint", ["Spreadsheet Excel Pro", "Notepad", "Access"]),
  q("junior", "Software", 30, "Why should users keep regular backups of important files?", "To recover lost files safely", ["To double processor clock cycle speed", "To vectorize photos", "To skip passwords"]),
  q("junior", "Software", 31, "What does pressing Ctrl + Z typically do in an editor?", "Undoes the last edit", ["Closes every active window tab", "Saves backup", "Zooms page"]),
  q("junior", "Software", 32, "Which of these is a common raster image file format?", "PNG image", ["MP3 audio file", "EXE app", "WAV clip"]),
  q("junior", "Software", 34, "What does an operating system's Task Manager primarily monitor?", "Running apps and CPU load", ["Monthly broadband internet billing cost", "Ink reserve level", "Screen brightness"]),
  q("junior", "Internet", 24, "What does URL stand for on the World Wide Web?", "Uniform Resource Locator", ["Universal Web Routing Link Path", "Unified Library", "User Reference"]),
  q("junior", "Internet", 25, "What does WWW stand for at the start of web addresses?", "World Wide Web", ["Wired Wireless Data Window", "Wide Workspace", "World Archive"]),

  // 30..44: rank 2 (2 distractors longer, 1 distractor shorter)
  q("junior", "Internet", 27, "Which service lets people search the web for keywords and pages?", "Search engine", ["Hardware driver loader tool", "Language syntax compiler", "Disk slot"]),
  q("junior", "Internet", 28, "What does a modem do for a home internet connection?", "Converts line signals", ["Stores family photos on long tapes", "Renders 3D graphics for desktop games", "Cleans keys"]),
  q("junior", "Internet", 30, "What is the main purpose of cloud storage services?", "Save files remotely", ["Archive files only on floppy disks", "Increase physical laptop battery weight", "Print pages"]),
  q("junior", "Internet", 31, "Which symbol separates the username from the domain in email?", "@ sign", ["# hash symbol", "$ dollar mark", "& key"]),
  q("junior", "Internet", 33, "What does a URL shortener service create?", "A short redirect link", ["A stronger firewall for home routers", "A smaller screen mode for phones", "Setup file"]),
  q("junior", "Web Basics", 26, "What does HTML stand for when building web pages?", "HyperText Markup Language", ["HighText Machine Source Language", "Hyperlink Transfer Modeling Format", "Home Tool Web"]),
  q("junior", "Web Basics", 29, "What is CSS primarily used for on a website?", "Styling page layout", ["Encrypting payment cards on remote hosts", "Formatting portable USB flash drives", "Routing cables"]),
  q("junior", "Web Basics", 32, "Which file format is used for plain text documents?", ".txt file", [".mp4 video clip", ".exe installer", ".zip"]),
  q("junior", "Security", 27, "What is computer malware?", "Harmful code", ["Shielded cable connecting stereo audio", "Thermal cooling paste placed on CPUs", "System patch"]),
  q("junior", "Security", 29, "What is a phishing attempt?", "Fake login scam", ["Careful calibration of LCD display colors", "Fast sorting of spreadsheet columns", "Cable check"]),
  q("junior", "Security", 30, "What does antivirus software mainly do?", "Stops malware threats", ["Boosts speaker loudness past limits", "Converts wired mice to Bluetooth links", "Reads PDFs"]),
  q("junior", "Security", 31, "Why do strong passwords mix letters, numbers, and symbols?", "Resist guessing", ["Reduce battery drain on portable PCs", "Load heavy web pages twice as fast", "Shrink images"]),
  q("junior", "Security", 33, "What is a firewall's basic job on a network?", "Filter traffic", ["Boost monitor refresh speeds smoothly", "Clean dust off cooling fan blades", "Sort folders"]),
  q("junior", "Security", 34, "What does a password manager help a user do?", "Vault unique logins", ["Increase processor speed automatically", "Bypass school wireless login screens", "Compile code"]),
  q("junior", "Computing", 30, "What is an algorithm in computer science?", "Step-by-step rules", ["Silicon microchip placed under keycaps", "Damaged copper wire inside a power cord", "User avatar"]),

  // 45..59: rank 3 (shortest among 4 balanced choices, mostly Boss)
  q("junior", "Computing", 32, "What is a software bug?", "Code flaw", ["An actual insect stuck underneath keys", "A high-bandwidth optical fiber network link", "A verified backup snapshot stored on tape"]),
  q("junior", "Computing", 35, "Who wrote the first published algorithm intended for a machine?", "Ada Lovelace", ["Grace Brewster Hopper", "Alan Mathison Turing", "Sir Tim Berners-Lee"], true),
  q("junior", "Hardware", 35, "Which memory holds firmware instructions even when power is off?", "ROM chip", ["Dynamic RAM stick", "L1 Processor Cache", "CPU Flag Register"], true),
  q("junior", "Hardware", 36, "How many bytes are in one kibibyte (KiB)?", "1,024 bytes", ["1,000 metric bytes", "512 sector bytes", "2,048 block bytes"], true),
  q("junior", "Networking", 36, "Which device forwards packets between home devices and your ISP?", "Router", ["Flatbed scanner", "Desktop monitor", "Laptop trackpad"], true),
  q("junior", "Internet", 37, "Which organization maintains the Domain Name System root hints?", "ICANN", ["IEEE Standards", "UNESCO Agency", "W3C Consortium"], true),
  q("junior", "Software", 37, "Which term describes a program free to inspect and modify?", "Open-source app", ["Proprietary trial licenseware", "Locked hardware firmware ROM", "Time-limited shareware bundle"], true),
  q("junior", "Security", 38, "What does two-factor authentication require beyond a password?", "Second check", ["High-resolution desktop wallpaper", "Gigabit wired ethernet adapter", "Freshly formatted storage drive"], true),
  q("junior", "Web Basics", 38, "Which tag creates a clickable hyperlink in HTML?", "<a>", ["<p> paragraph", "<img> graphic", "<div> section"], true),
  q("junior", "Computing", 39, "Which decimal number equals 1010 in binary?", "10", ["12 (twelve)", "8 (eight)", "14 (fourteen)"], true),
  q("junior", "Computing", 40, "What does ASCII stand for in character encoding?", "American Standard Code for Information Interchange", ["Advanced System Coding for Internet Data Indexing Web", "Automated Serial Codes for Universal Input Hardware Keys", "Applied Symbolic Character Format Identification Standard"], true),
  q("junior", "Hardware", 41, "Which storage medium uses microscopic pits read by a laser?", "Optical disc", ["Compact flash card", "Magnetic reel tape", "Static SRAM module"], true),
  q("junior", "Networking", 41, "Which IEEE standard family defines Wi-Fi wireless LANs?", "Wi-Fi 802.11", ["Ethernet 802.3", "FireWire 1394", "IEEE 754 Float"], true),
  q("junior", "Internet", 42, "What does HTTP stand for in web communication?", "HyperText Transfer Protocol", ["High Transmission Packet Routing Data Path", "Host Terminal Transport Control Socket Port", "Hyperlink Tool Tracking Secure Data Process"], true),
  q("junior", "Computing", 42, "What happens when you compress files into a .zip archive?", "Shrinks file size", ["Converts directly into playable arcade games", "Erases original creation calendar timestamps", "Uploads automatically straight to satellites"], true),
];

const SEMI_SENIOR_QUESTIONS = [
  // 0..14: rank 0 (longest)
  q("semi-senior", "Programming", 40, "Which language runs directly inside browsers for interactive pages?", "JavaScript", ["Fortran", "COBOL", "Pascal"]),
  q("semi-senior", "Programming", 42, "What does a compiler do to source code before execution?", "Translates code into machine language", ["Uploads files to cloud", "Formats bold comments", "Shrinks static photos"]),
  q("semi-senior", "Programming", 41, "Which of these is a markup language rather than a programming language?", "HTML markup", ["Python 3", "Java VM", "Rust"]),
  q("semi-senior", "Programming", 43, "Which Python function returns the number of items in a list?", "len(items)", ["size()", "count()", "num()"]),
  q("semi-senior", "Programming", 44, "In Python, which statement block catches runtime errors safely?", "try / except", ["if / else", "for / in", "def / end"]),
  q("semi-senior", "Programming", 45, "Which keyword is NOT a native loop construct in standard C?", "repeat loop", ["for loop", "while", "do-while"]),
  q("semi-senior", "Programming", 44, "What is the standard file extension for a JavaScript source file?", ".js script", [".java", ".json", ".py"]),
  q("semi-senior", "Programming", 45, "Which syntax correctly imports a module named math in Python?", "import math", ["use math", "load math", "need math"]),
  q("semi-senior", "Programming", 46, "Which syntax defines a named function in JavaScript?", "function run() {}", ["def run():", "fn run()", "sub run"]),
  q("semi-senior", "Programming", 47, "Which language did Google endorse as preferred for modern Android apps?", "Kotlin language", ["Swift app", "Ruby", "PHP"]),
  q("semi-senior", "Programming", 46, "Who originally designed the Java programming language at Sun Microsystems?", "James Gosling", ["Guido Rossum", "Brendan Eich", "Dennis Ritchie"]),
  q("semi-senior", "Programming", 48, "Which language is widely dominant in machine learning and data science?", "Python code", ["Pascal", "HTML", "CSS"]),
  q("semi-senior", "Programming", 47, "What does a script typically refer to in software?", "Interpreted sequence of commands", ["Silicon chip packaging tag", "Wireless router antenna", "Database power unit"]),
  q("semi-senior", "Programming", 48, "What is the boolean result of '0.1 + 0.2 === 0.3' in JavaScript?", "false (IEEE 754)", ["true", "null", "NaN"]),
  q("semi-senior", "Programming", 49, "Which of these is NOT a standard JavaScript primitive type?", "character", ["string", "number", "symbol"]),

  // 15..29: rank 1 (1 longer, 2 shorter)
  q("semi-senior", "Programming", 48, "Which programming paradigm emphasizes composing pure functions?", "Functional programming", ["HTML templating template markup", "Cable routing", "Disk wiping"]),
  q("semi-senior", "Web Dev", 41, "Which CSS rule target lets you reuse styles across many elements?", "Class selector", ["Inline comment tag block", "Meta tag", "Link"]),
  q("semi-senior", "Web Dev", 43, "Which of these is NOT a valid CSS styling property?", "text-box", ["font-size declaration", "border", "color"]),
  q("semi-senior", "Web Dev", 44, "What does JSON stand for in web APIs?", "JavaScript Object Notation", ["Java System Object Network Format", "Joint Naming", "Online Space"]),
  q("semi-senior", "Web Dev", 45, "What does API stand for in software engineering?", "Application Programming Interface", ["Automated Software Process Integration", "Applied Protocol", "Active Command"]),
  q("semi-senior", "Web Dev", 46, "What does npm stand for in the Node.js ecosystem?", "Node Package Manager", ["Network Protocol Traffic Monitor", "Native Module", "Node Memory"]),
  q("semi-senior", "Web Dev", 47, "What is an HTTP cookie in web browsers?", "Small client request data", ["Permanent GPU shader blob archive", "Router key", "CD index"]),
  q("semi-senior", "Web Dev", 48, "Which HTTP status code means a request succeeded normally?", "200 OK", ["404 Not Found", "500", "301"]),
  q("semi-senior", "Web Dev", 46, "Which HTTP status code means the requested page was not found?", "404 Not Found", ["200 Request Success", "201", "503"]),
  q("semi-senior", "Web Dev", 49, "Which default TCP port does encrypted HTTPS traffic use?", "Port 443", ["Port 80 (HTTP)", "Port 21", "Port 25"]),
  q("semi-senior", "Web Dev", 48, "What does MVC stand for in application architecture?", "Model View Controller", ["Main Visual Display Container", "Virtual Cluster", "Vector Cache"]),
  q("semi-senior", "Git", 43, "Which Git command downloads a remote repository to your computer?", "git clone", ["git branch list", "git tag", "git add"]),
  q("semi-senior", "Git", 44, "Which Git command shows modified files and the current branch?", "git status", ["git push origin", "git init", "git log"]),
  q("semi-senior", "Git", 45, "What does the 'git commit' command record?", "Staged change snapshot", ["Full wipe of remote git branches", "Kernel update", "Reboot PC"]),
  q("semi-senior", "Git", 47, "What does 'git push' do with local commits?", "Uploads commits to remote", ["Deletes uncommitted local text files", "Compiles C code", "Resets keys"]),

  // 30..44: rank 2 (2 longer, 1 shorter)
  q("semi-senior", "Git", 46, "Which popular platform hosts Git repositories in the cloud?", "GitHub", ["Jenkins CI server", "Apache web server", "SQLite"]),
  q("semi-senior", "Databases", 43, "What does SQL stand for in database management?", "Structured Query Language", ["Simple Sequential Query Logic", "System Queue Lookup Language", "Search Tool"]),
  q("semi-senior", "Databases", 45, "Which SQL command retrieves rows from a database table?", "SELECT", ["INSERT INTO", "UPDATE SET", "DROP"]),
  q("semi-senior", "Databases", 47, "What does 'SELECT DISTINCT' do in a SQL query?", "Returns unique rows", ["Deletes every empty table column", "Sorts tables into folders", "Zips DB"]),
  q("semi-senior", "Databases", 48, "What is a primary key in a relational table?", "Unique row ID", ["Secret password protecting logins", "Stylesheet applied to web forms", "RAM slot"]),
  q("semi-senior", "Databases", 49, "Which database is a relational SQL system rather than NoSQL?", "PostgreSQL", ["MongoDB Document", "Apache Cassandra", "Redis"]),
  q("semi-senior", "Databases", 50, "Which of these is a document-oriented NoSQL database?", "MongoDB", ["Oracle MySQL", "Server MariaDB", "SQLite"]),
  q("semi-senior", "Networking", 42, "What does DNS stand for on the internet?", "Domain Name System", ["Digital Network Routing Server", "Dynamic Node Directory Service", "Data Standard"]),
  q("semi-senior", "Networking", 44, "What is the main role of DNS in web browsing?", "Maps domains to IPs", ["Encrypts hard drive partitions", "Compresses live video streams", "Blocks ads"]),
  q("semi-senior", "Networking", 45, "Which protocol is primarily used to send outgoing email messages?", "SMTP", ["FTP transfer", "HTTP protocol", "SNMP"]),
  q("semi-senior", "Networking", 46, "What does the 'ping' command test on a network?", "Host reachability", ["Monitor pixel gamma calibration", "CPU thermal throttling speed", "Disk rate"]),
  q("semi-senior", "Networking", 47, "What does VPN stand for in network privacy?", "Virtual Private Network", ["Verified Public Routing Node", "Variable Packet Tunnel Network", "Visual Route"]),
  q("semi-senior", "Networking", 48, "Which network topology connects every node directly to every other?", "Mesh layout", ["Linear bus topology", "Closed ring topology", "Star hub"]),
  q("semi-senior", "Networking", 49, "What does an IP address identify on a TCP/IP network?", "Network host", ["Painted color of ethernet jacks", "Factory serial inside monitors", "Cell volts"]),
  q("semi-senior", "Networking", 50, "What does a network switch primarily do inside a local LAN?", "Forwards MAC frames", ["Translates JavaScript syntax fast", "Generates public TLS certificates", "Builds HTML"]),

  // 45..59: rank 3 (shortest, mostly Boss)
  q("semi-senior", "Security", 48, "What does DDoS stand for in cybersecurity?", "Distributed Denial of Service", ["Dynamic Data Output Storage Systems", "Direct Domain Overwrite Script Tool", "Dual Disk Operating Security Layers"]),
  q("semi-senior", "Security", 50, "What is encryption designed to ensure for stored or sent data?", "Data confidentiality", ["Larger storage footprints on drives", "Higher monitor frame refresh rates", "Automatic spelling fixes in emails"]),
  q("semi-senior", "Systems", 49, "Who created the original Linux operating system kernel in 1991?", "Linus Torvalds", ["Kenneth Thompson", "Dennis MacAlistair", "Richard M Stallman"]),
  q("semi-senior", "Systems", 50, "What is a virtual machine in computing?", "Emulated PC", ["Physical laser scanner reading tags", "Cooling fan built beneath keys", "Browser bookmark sync extension"]),
  q("semi-senior", "Systems", 51, "Which tool packages apps and dependencies into portable containers?", "Docker", ["Adobe Photoshop", "Microsoft Excel", "Windows Notepad"]),
  q("semi-senior", "Systems", 52, "What does SaaS stand for in cloud software?", "Software as a Service", ["System Managed Storage Service", "Server Script Runtime Service", "Security Managed as Standard"], true),
  q("semi-senior", "Web Dev", 53, "Which HTTP status code indicates an unexpected internal server error?", "500", ["200 OK", "304 Not Modified", "401 Unauthorized"], true),
  q("semi-senior", "Networking", 53, "What does UDP stand for in transport protocols?", "User Datagram Protocol", ["Unified Data Transfer Pipeline", "Universal Packet Delivery Port", "User Directory Control Process"], true),
  q("semi-senior", "Networking", 54, "Which HTTP status code signals a permanent redirect to a new URL?", "301", ["204 No Content", "403 Forbidden", "502 Bad Gateway"], true),
  q("semi-senior", "Programming", 54, "Which language runs natively in the CPython interpreter?", "Python", ["Matz Ruby", "Wall Perl", "Mozilla Rust"], true),
  q("semi-senior", "Databases", 55, "Which SQL clause filters grouped aggregate results after GROUP BY?", "HAVING", ["ORDER BY clause", "DISTINCT filter", "VALUES list"], true),
  q("semi-senior", "Git", 55, "Which Git command combines changes from another branch into yours?", "git merge", ["git status view", "git remote show", "git clean files"], true),
  q("semi-senior", "Security", 56, "What does modern TLS replace in encrypted web connections?", "Legacy SSL", ["HTML anchor elements", "CSS flexbox stylesheets", "SQL database schemas"], true),
  q("semi-senior", "Programming", 57, "What does Big-O notation primarily describe for an algorithm?", "Scaling complexity", ["How many comment lines exist in files", "Which keyboard layout wrote source", "What monitor resolution runs builds"], true),
  q("semi-senior", "Systems", 58, "What does a load balancer distribute across backend servers?", "Client traffic", ["Copper motherboard socket power pins", "Printed paper documentation manuals", "Keyboard LED backlight brightness"], true),
];

const SENIOR_QUESTIONS = [
  // 0..14: rank 0 (longest)
  q("senior", "OOP", 56, "Which OOP principle bundles data and methods while hiding internals?", "Encapsulation", ["Recursion", "Memoization", "Tokenization"]),
  q("senior", "OOP", 57, "Which OOP feature lets a subclass override behavior of a parent class?", "Polymorphism", ["Compilation", "Normalizing", "Paging"]),
  q("senior", "OOP", 58, "Which keyword in Java makes a method or class accessible across packages?", "public access", ["static key", "final key", "void type"]),
  q("senior", "OOP", 59, "Which language among these natively supports OOP classes?", "C++ classes", ["ANSI C", "x86 ASM", "Fortran"]),
  q("senior", "OOP", 62, "What does the Single Responsibility Principle state in SOLID design?", "One class, one reason to change", ["One loop per method body", "One file per app build", "Zero interface methods"]),
  q("senior", "OOP", 64, "What does the Decorator design pattern enable at runtime?", "Adds behaviors dynamically", ["Drops unused SQL tables", "Builds JS into BIOS", "Sorts linked lists O(1)"]),
  q("senior", "OOP", 65, "How does the Observer pattern notify dependent components?", "Pushes state changes to listeners", ["Polls hardware clocks fast", "Inlines virtual dispatches", "Broadcasts raw IP packets"]),
  q("senior", "Data Structures", 57, "What is a hash table primarily optimized for?", "Fast average O(1) key lookup", ["HD video frame encoding", "Sorted disk pointers", "3D triangle rendering"]),
  q("senior", "Data Structures", 58, "How are elements structured in a singly linked list?", "Nodes with value and next link", ["Contiguous offset arrays", "Symmetric hash buckets", "Balanced red-black trees"]),
  q("senior", "Data Structures", 59, "Which ordering rule governs a standard stack data structure?", "Last In, First Out (LIFO)", ["First In, First Out", "Highest Priority Out", "Random Eviction"]),
  q("senior", "Data Structures", 60, "Which ordering rule governs a standard queue data structure?", "First In, First Out (FIFO)", ["Last In, First Out", "Smallest Hash First", "Deepest Leaf First"]),
  q("senior", "Data Structures", 63, "How does an LRU cache choose which item to evict when full?", "Evicts least recently used", ["Drops largest alpha key", "Removes oldest arrival", "Clears random slot"]),
  q("senior", "Algorithms", 58, "Which comparison sort guarantees O(n log n) worst-case time?", "Merge sort algorithm", ["Bubble sort", "Insertion", "Selection"]),
  q("senior", "Algorithms", 60, "What prerequisite must hold before running binary search on an array?", "Elements must be sorted", ["Length must be prime", "Items must be positive", "Stored in a heap"]),
  q("senior", "Algorithms", 61, "Which strategy splits a problem into subproblems and combines results?", "Divide and conquer", ["Brute-force scan", "Greedy search", "Random trial"]),

  // 15..29: rank 1 (1 longer, 2 shorter)
  q("senior", "Algorithms", 62, "What is the worst-case time complexity of binary search on n items?", "O(log n)", ["O(n log n) linearithmic", "O(n)", "O(n^2)"]),
  q("senior", "Algorithms", 64, "Which graph traversal visits neighbors level by level?", "Breadth-First Search", ["Kahn Topological Sort Order", "Depth-First", "Prim MST"]),
  q("senior", "Algorithms", 66, "Which sort partitions around a pivot in O(n log n) average time?", "Quicksort", ["Counting sort pass", "Bubble", "Gnome"]),
  q("senior", "Databases", 59, "What is SQL injection in web security?", "Input altering SQL queries", ["Compressing large table B-tree indexes", "Schema migration", "Tape cipher"]),
  q("senior", "Databases", 61, "How do parameterized queries prevent SQL injection attacks?", "Separate code from user data", ["Conceal SQL table names inside CSS", "Drop primary keys", "Store images"]),
  q("senior", "Databases", 62, "What is a foreign key in a relational database?", "Column linking another table", ["Expired cryptographic TLS token", "Shared admin key", "L2 cache line"]),
  q("senior", "Databases", 63, "Why do relational databases create B-tree indexes on columns?", "Speed up lookups and ranges", ["Shrink embedded image payloads fast", "Replace write logs", "Skip caching"]),
  q("senior", "Databases", 65, "What does database normalization primarily reduce?", "Redundancy and anomalies", ["Physical latency across fiber links", "C++ build errors", "Pixel banding"]),
  q("senior", "Web Engineering", 58, "What does 'await' do inside an async JavaScript function?", "Pauses until promise settles", ["Freezes the whole browser event loop", "Drops HTTP headers", "Runs TS build"]),
  q("senior", "Web Engineering", 60, "What core principle makes a REST API stateless?", "Requests carry full context", ["Servers retain permanent session RAM", "Binary sockets only", "Omit status"]),
  q("senior", "Web Engineering", 61, "Which HTTP method is idempotent and typically replaces a target resource?", "PUT", ["CONNECT tunnel", "POST", "HEAD"]),
  q("senior", "Web Engineering", 62, "What is a key difference between TCP and UDP transport?", "TCP guarantees ordered packets", ["UDP checks every packet twice blindly", "TCP works offline", "UDP sends keys"]),
  q("senior", "Web Engineering", 63, "What does CORS control in modern web browsers?", "Cross-origin access rules", ["Local physical disk mount rights", "CPU core affinity", "SQL join plan"]),
  q("senior", "Web Engineering", 65, "What is a Content Delivery Network (CDN) built to do?", "Serve assets from nearby edges", ["Compile native mobile apps in clouds", "Swap IDs for UUIDs", "Scan keyboards"]),
  q("senior", "Cloud & DevOps", 59, "What does CI/CD stand for in modern software delivery?", "Continuous Integration and Deployment", ["Centralized Indexing and Code Debugging", "Container Cloud", "Core Drivers"]),

  // 30..44: rank 2 (2 longer, 1 shorter)
  q("senior", "Cloud & DevOps", 61, "How does PaaS differ from IaaS in cloud computing?", "PaaS manages runtime", ["IaaS writes business code for apps", "PaaS blocks SQL engines on clouds", "Offline only"]),
  q("senior", "Cloud & DevOps", 62, "What happens during horizontal scaling of a web service?", "Adds server nodes", ["Upgrades one existing CPU and RAM", "Replaces all SQL stores with HTML", "Drops logs"]),
  q("senior", "Cloud & DevOps", 63, "What happens during vertical scaling of a single database node?", "Upgrades node hardware", ["Splits shards across fifty regions", "Exports SQL schemas into flat CSV", "Cuts pass"]),
  q("senior", "Cloud & DevOps", 64, "Why do production APIs enforce rate limiting?", "Protect capacity", ["Slow down static CSS file caching", "Convert JSON payloads into XML", "Drop TLS"]),
  q("senior", "Systems", 60, "What is lazy loading in ORM data access?", "Loads on access", ["Loads every table row at bootup", "Disables primary indexes on reads", "Skips fsync"]),
  q("senior", "Systems", 62, "How does eager loading differ from lazy loading?", "Fetches upfront", ["Lazy preloads all tables at boot", "Eager forbids foreign key joins", "No cache"]),
  q("senior", "Systems", 63, "Why do high-speed systems store hot datasets in memory?", "Avoids disk seeks", ["Platters corrupt numbers on boot", "RAM retains data without power", "Skip SSDs"]),
  q("senior", "Systems", 65, "What causes a race condition in concurrent code?", "Unordered writes", ["A thread recurses to stack overflow", "A spinning disk runs out of space", "DNS timeout"]),
  q("senior", "Systems", 66, "What is a deadlock in multithreaded execution?", "Mutual lock wait", ["A worker thread finishes early", "L1 cache lines flush prematurely", "GC sweeps"]),
  q("senior", "Security", 64, "Why should passwords be stored with salted cryptographic hashes?", "Stop rainbow tables", ["Let admins read plain passwords", "Compress login tables onto tapes", "Skip HTTPS"]),
  q("senior", "Security", 66, "What does Cross-Site Scripting (XSS) inject into a web app?", "Browser scripts", ["Corrupted sectors on server SSDs", "Duplicate MAC tags on switches", "Bad SQL key"]),
  q("senior", "Algorithms", 67, "Which structure powers Dijkstra's shortest-path vertex choice?", "Min-heap priority queue", ["Singly linked LIFO stack list", "Fixed circular ring data buffer", "Bit array"], true),
  q("senior", "Algorithms", 68, "What is memoization in dynamic programming?", "Caching subproblems", ["Shuffling arrays before binary sort", "Flushing L1 cache on every miss", "Inline code"]),
  q("senior", "Data Structures", 68, "Which traversal of a binary search tree yields sorted keys?", "In-order traversal", ["Pre-order root-first traverse", "Post-order child-first visit", "Level walk"], true),
  q("senior", "Data Structures", 69, "What is the average-case search time of a balanced BST?", "O(log n)", ["O(n) linear scan", "O(n^2) quadratic", "O(1)"], true),

  // 45..59: rank 3 (shortest, mostly Boss)
  q("senior", "Web Engineering", 69, "How do WebSockets differ from HTTP Server-Sent Events (SSE)?", "Full-duplex vs one-way", ["SSE carries raw binary frames; WebSockets XML", "WebSockets close per message; SSE stays open", "SSE uses connectionless UDP; WebSockets ICMP"], true),
  q("senior", "Web Engineering", 70, "What technique holds an HTTP request open until new data arrives?", "Long polling", ["DNS cache prefetching", "Static edge caching", "Firewall port knocking"], true),
  q("senior", "Databases", 70, "Which ACID property ensures a committed transaction survives a crash?", "Durability", ["Strict Atomicity", "Schema Consistency", "Lock Isolation"], true),
  q("senior", "Databases", 71, "Which ACID property guarantees transactions execute all-or-nothing?", "Atomicity", ["Disk Durability", "Data Consistency", "High Availability"], true),
  q("senior", "Systems", 71, "What is the main role of virtual memory paging in an OS?", "Map virtual pages", ["Compiles kernel drivers automatically at boot", "Encrypts wireless packets inside network cards", "Schedules GPU triangle shading on monitors"], true),
  q("senior", "Systems", 72, "What is the fundamental difference between a process and a thread?", "Isolated memory", ["Threads own separate disks; processes do not", "Processes run only on GPUs; threads on CPUs", "Threads never preempt; processes always block"], true),
  q("senior", "Networking", 72, "What happens during the TCP three-way handshake?", "SYN, SYN-ACK, ACK", ["GET, POST, DELETE negotiate REST routes", "DNS, ARP, ICMP register domain servers", "TLS, SSH, FTP exchange login credentials"], true),
  q("senior", "Networking", 73, "Which protocol resolves an IPv4 address to a MAC address on a LAN?", "ARP", ["BGP routing", "SMTP mail", "ICMP echo"], true),
  q("senior", "Cloud & DevOps", 73, "Why is immutable infrastructure favored in automated cloud deploys?", "Stops config drift", ["Manual SSH edits apply much faster live", "Virtual servers never need security updates", "Single nodes can never exhaust memory"], true),
  q("senior", "Compilers", 74, "What does a lexical analyzer (lexer) produce from source text?", "Token stream", ["A compiled executable ELF binary archive", "A doubly linked list of heap allocations", "An encrypted TLS session resumption ticket"], true),
  q("senior", "Theory", 74, "Which finite automaton allows epsilon or multiple transitions per state?", "NFA", ["Deterministic Automaton (DFA)", "Pushdown Stack Automaton", "Linear Bounded Transducer"], true),
  q("senior", "Theory", 75, "Which language class is recognized by a Deterministic Finite Automaton?", "Regular languages", ["Context-free languages", "Turing-recognizable sets", "Undecidable languages"], true),
  q("senior", "Algorithms", 75, "What is the time complexity of the Fast Fourier Transform (FFT)?", "O(n log n)", ["O(n) linear", "O(n^2) quadratic", "O(log n) logarithmic"], true),
  q("senior", "Systems", 76, "How does a mutex differ from a counting semaphore?", "Single ownership", ["Semaphores lock disk files; mutexes lock CPUs", "Mutex allows N concurrent threads; semaphore one", "Semaphores run in browsers; mutexes in SQL"], true),
  q("senior", "Security", 76, "What does asymmetric cryptography use?", "Public/private keys", ["One shared symmetric key sent in plain text", "Plaintext CRC checksums lacking any secret", "Randomized hardware MAC tags on each router"], true),
];

const ULTRA_ADVANCED_QUESTIONS = [
  // 0..14: rank 0 (longest)
  q("ultra-advanced", "Distributed Systems", 76, "What three guarantees does Brewer's CAP theorem relate?", "Consistency, Availability, Partition", ["Consistency, Atomicity, Durability", "Concurrency, Scalability, Safety", "Throughput, Latency, Ordering"]),
  q("ultra-advanced", "Distributed Systems", 78, "Under a network partition in CAP, what trade-off must a system make?", "Choose CP or AP behavior", ["Switch SQL to XML tags", "Add more CPU core RAM", "Drop TCP for Ethernet"]),
  q("ultra-advanced", "Distributed Systems", 77, "How do ACID databases contrast with BASE distributed stores?", "ACID favors safety; BASE scales", ["BASE skips write logs", "ACID runs only NoSQL", "BASE uses one core"]),
  q("ultra-advanced", "Distributed Systems", 79, "What does eventual consistency guarantee across replicas?", "Nodes converge without new writes", ["All reads block on writes", "Transactions abort on lag", "Replicas drop old writes"]),
  q("ultra-advanced", "Distributed Systems", 80, "What problem does the Paxos family of algorithms solve?", "Fault-tolerant consensus", ["Lossless SQL compression", "Symmetric TLS key setup", "Static CDN routing"]),
  q("ultra-advanced", "Distributed Systems", 81, "How does Raft simplify consensus compared to classic Paxos?", "Separates leader election and logs", ["Removes quorum majorities", "Skips partition handling", "Uses UDP broadcasts"]),
  q("ultra-advanced", "Distributed Systems", 80, "What are vector clocks used to track in distributed systems?", "Causal order between events", ["Wall clock GPS drift", "Free JVM heap bytes", "HTTP packet rates"]),
  q("ultra-advanced", "Distributed Systems", 82, "How does Google Spanner coordinate global external consistency?", "TrueTime bounded uncertainty wait", ["Last-write-wins OS clocks", "Sticky browser cookies", "Zero-quorum gossip"]),
  q("ultra-advanced", "Distributed Systems", 79, "Why does quorum replication require R + W > N?", "Read and write sets overlap", ["All replicas fail together", "Switches double speed", "Latency drops to zero"]),
  q("ultra-advanced", "Distributed Systems", 81, "What is the main drawback of the two-phase commit (2PC) protocol?", "Coordinator crash blocks nodes", ["Supports only two tables", "Skips disk flushing", "Allows dirty reads"]),
  q("ultra-advanced", "Distributed Systems", 82, "Why is leader election essential in replicated state machines?", "One node orders log entries", ["Followers skip disk reads", "TCP blocks peer links", "Clients drop hashes"]),
  q("ultra-advanced", "Distributed Systems", 83, "How does consistent hashing help distributed caches scale?", "Moves only nearby key ranges", ["Rehashes every key always", "Stores keys on one host", "Polls every shard"]),
  q("ultra-advanced", "Distributed Systems", 80, "What core abstraction powers Apache ZooKeeper coordination?", "Consensus-backed hierarchical tree", ["Columnar SQL query planner", "React state hook store", "FPGA packet switch"]),
  q("ultra-advanced", "Distributed Systems", 82, "What does the FLP impossibility result prove about async consensus?", "No deterministic crash-safe solve", ["Finishes inside two RTTs", "Needs odd server counts", "Clocks stay synced"]),
  q("ultra-advanced", "Distributed Systems", 84, "Why are Lamport timestamps insufficient to detect concurrency alone?", "Timestamp order lacks converse", ["Counters overflow fast", "Needs atomic GPS clocks", "Single-thread only"]),

  // 15..29: rank 1 (1 longer, 2 shorter)
  q("ultra-advanced", "Storage Engines", 78, "Why is a Log-Structured Merge-tree (LSM) fast for heavy writes?", "Sequential appends plus compaction", ["Updates random B-tree pages strictly in place", "Stores indexes on tape", "Skips WAL logs"]),
  q("ultra-advanced", "Storage Engines", 77, "How do Bloom filters accelerate LSM-tree read lookups?", "Skip SSTables lacking the key", ["Sorted arrays store full inline row bytes", "Prefetch all blocks", "Merge on reads"]),
  q("ultra-advanced", "Storage Engines", 79, "Which error type can a standard Bloom filter produce?", "False positives only", ["False negatives exclusively", "Both equally", "Zero errors"]),
  q("ultra-advanced", "Storage Engines", 76, "How does sharding differ from local table partitioning?", "Splits data across nodes", ["Replicates identical rows across regions", "Stays in one DB", "Graphs only"]),
  q("ultra-advanced", "Storage Engines", 78, "What is the purpose of a Write-Ahead Log (WAL) in databases?", "Log changes before page writes", ["Compress archival snapshots into zips", "Balance HTTP reads", "Evict cache"]),
  q("ultra-advanced", "Storage Engines", 80, "How do Bigtable and HBase relate architecturally?", "HBase implements Bigtable design", ["Bigtable is an SQL fork of HBase clusters", "Uses RDF graphs", "Runs in WASM"]),
  q("ultra-advanced", "Storage Engines", 81, "What does MVCC allow in concurrent relational databases?", "Non-blocking snapshot reads", ["Writers overwrite active reader locks", "Single CPU lock", "Rebuilds index"]),
  q("ultra-advanced", "Storage Engines", 83, "What concurrency anomaly does Snapshot Isolation still allow?", "Write skew across rows", ["Dirty reads of uncommitted bytes", "Lost same-key updates", "Table drops"]),
  q("ultra-advanced", "Storage Engines", 84, "Why do B+ trees store row values or pointers in leaf nodes?", "Linked leaves speed range scans", ["Branch nodes lack numeric key space", "Bypass prefetch", "Bulk splits"]),
  q("ultra-advanced", "Architecture", 77, "What defines Event Sourcing in service design?", "Immutable log of state events", ["Mutating one row in place only", "Polling REST endpoints", "Plain stdout"]),
  q("ultra-advanced", "Architecture", 78, "What does CQRS separate to scale workloads independently?", "Write commands from read queries", ["Frontend CSS files from backend SQL", "TLS from TCP", "CI runners"]),
  q("ultra-advanced", "Architecture", 79, "What responsibilities belong to an API Gateway in microservices?", "Routing, auth, and rate limits", ["Compiling service binaries on deploys", "Replacing SQL", "CPU threads"]),
  q("ultra-advanced", "Architecture", 80, "What extra layer does a service mesh handle via sidecars?", "Discovery, mTLS, and retries", ["Static HTML templating for landing pages", "Foreign keys", "Salt hashing"]),
  q("ultra-advanced", "Architecture", 81, "How does content-based routing differ from domain-based routing?", "Routes by message payload", ["Hashes strictly destination IPv4 address", "Binds DNS TLDs", "Switch ports"]),
  q("ultra-advanced", "Architecture", 78, "Why does Event-Driven Architecture decouple services?", "Emitters ignore subscriber count", ["Consumers block producers with RPC locks", "One SQL table", "HTTP polling"]),

  // 30..44: rank 2 (2 longer, 1 shorter)
  q("ultra-advanced", "Architecture", 79, "How do microservices trade off operational complexity vs monoliths?", "Independent deploys", ["Zero network overhead alongside fewer parts", "Shared process memory with zero isolation", "No tracing"]),
  q("ultra-advanced", "Architecture", 82, "What role does the Saga pattern play across microservices?", "Compensating steps", ["Locks every database under one coordinator", "Serializes all traffic through one queue", "Nightly cron"]),
  q("ultra-advanced", "Architecture", 83, "What does a circuit breaker prevent during downstream outages?", "Cascading retries", ["SQL syntax mistakes inside client forms", "Disk sector fragmentation during rotation", "CDN misses"]),
  q("ultra-advanced", "Architecture", 84, "What does the Transactional Outbox pattern guarantee?", "Atomic write + event", ["Zero transmission latency across WAN links", "Automatic schema inference for NoSQL", "No indexes"]),
  q("ultra-advanced", "Stream Processing", 79, "What is backpressure in reactive stream processing?", "Consumers throttle", ["Producers drop delivery acks silently", "Brokers double batch sizes under strain", "OOM kills"]),
  q("ultra-advanced", "Stream Processing", 80, "What distinguishes Kafka Streams from standalone broker clusters?", "Embedded topic SDK", ["Relational SQL database replacing logs", "Browser WebSocket proxy serving REST", "Batch jobs"]),
  q("ultra-advanced", "Stream Processing", 81, "How does MapReduce process massive datasets across clusters?", "Map and reduce keys", ["Streams individual rows on one GPU core", "Replicates full tables to web browsers", "Local sort"]),
  q("ultra-advanced", "Stream Processing", 82, "What is the key difference between event time and processing time?", "Event vs arrival", ["Total CPU cycles versus wall seconds", "Broker fsync versus socket ack", "Partitions"]),
  q("ultra-advanced", "Stream Processing", 83, "Why do streaming systems use watermarks?", "Bound late events", ["Sign cryptographic TLS keys on brokers", "Compress Parquet blocks on object stores", "SQL keys"]),
  q("ultra-advanced", "Concurrency", 78, "Why does immutable data simplify concurrent programming?", "No shared mutation", ["Runtime garbage collectors stay off", "CPU L1 caches double set associativity", "Strict order"]),
  q("ultra-advanced", "Concurrency", 80, "Which deadlock condition breaks when locks follow a global order?", "Circular wait", ["Mutual exclusion lock", "Hold and wait condition", "Preemption"]),
  q("ultra-advanced", "Concurrency", 82, "What problem does compare-and-swap (CAS) solve in lock-free code?", "Atomic updates", ["Automatic dead-letter message routing", "Zero-copy block compression on NVMe", "DNS TTLs"]),
  q("ultra-advanced", "Concurrency", 83, "What is the ABA problem in lock-free CAS algorithms?", "Hidden revert edits", ["Two mutexes acquire locks in inverted order", "Thread pools spawn past physical cores", "OOM kills"]),
  q("ultra-advanced", "Concurrency", 84, "Why can false sharing hurt multicore CPU performance?", "Cache line thrashing", ["Processes map shared read-only pages", "Storage controllers split NVMe writes", "Loop unroll"]),
  q("ultra-advanced", "Systems", 85, "What is tail latency amplification in fan-out service calls?", "Slowest shard rules", ["Average CPU load drops at peak traffic", "Caches conceal slow downstream reads", "HTTP/3 size"]),

  // 45..59: rank 3 (shortest, mostly Boss)
  q("ultra-advanced", "Systems", 86, "How do hedged requests reduce p99 tail latency?", "Backup request", ["Silently drop the slowest one percent of sockets", "Disable TLS session resumption on API gateways", "Batch interactive clicks into hourly background jobs"]),
  q("ultra-advanced", "Systems", 87, "Why does zero-copy I/O (sendfile) improve network throughput?", "Skips user copies", ["Compresses TCP headers below four bytes total", "Executes kernel disk drivers inside browser tabs", "Eliminates network card DMA descriptor rings"]),
  q("ultra-advanced", "Distributed Systems", 88, "Why are CRDTs useful in offline-first collaborative apps?", "Lock-free merges", ["Central coordinators block offline client edits", "Vector clocks erase conflicting user changes", "Two-phase commit runs over Bluetooth beacons"], true),
  q("ultra-advanced", "Distributed Systems", 89, "What does linearizability guarantee over sequential consistency?", "Real-time ordering", ["Replicas converge eventually after quiet pauses", "Concurrent reads may return stale causal forks", "Writes reorder arbitrarily across client hosts"], true),
  q("ultra-advanced", "Distributed Systems", 90, "Why do gossip protocols scale well for cluster membership?", "Random peer sync", ["One coordinator leader polls every host inline", "All cluster nodes hold global locks when joining", "Heartbeat traffic funnels through one central hub"], true),
  q("ultra-advanced", "Storage Engines", 88, "What is write amplification in an LSM-tree database?", "Compaction rewrites", ["Client retries double outgoing HTTP headers", "Primary indexes fit inside L1 CPU cache", "SSD controllers skip flash wear-leveling"], true),
  q("ultra-advanced", "Storage Engines", 89, "Why does HyperLogLog use only kilobytes to count unique items?", "Leading zero bits", ["Stores exact 64-bit hashes inside B+ trees", "Compresses raw key strings via Huffman trees", "Samples every hundredth disk sector randomly"], true),
  q("ultra-advanced", "Storage Engines", 90, "What trade-off does a Count-Min Sketch make for frequencies?", "Slight overcount", ["Exact frequency counts using quadratic tables", "Zero hash collisions via sorted arrays", "Unbounded heap growth per unique element"], true),
  q("ultra-advanced", "Concurrency", 88, "How does work-stealing balance multicore thread pools?", "Steals busy deques", ["A central mutex dispatches every loop iteration", "Fast workers stall waiting on slower siblings", "Runnable tasks remain pinned strictly to core zero"], true),
  q("ultra-advanced", "Concurrency", 89, "What advantage does Read-Copy-Update (RCU) give read-heavy paths?", "Wait-free reads", ["Writers freeze every reader using spinlocks", "Readers acquire exclusive write memory barriers", "Updates mutate shared pointers without barriers"], true),
  q("ultra-advanced", "Compilers & Runtime", 90, "Why does Static Single Assignment (SSA) help optimization?", "Single assignment", ["Every function compiles without stack frames", "Runtime garbage collection becomes unnecessary", "All nested loops unroll to constant values"], true),
  q("ultra-advanced", "Networking", 89, "Why does QUIC (HTTP/3) eliminate TCP head-of-line blocking?", "UDP streams", ["One ordered byte stream carries every browser tab", "Edge routers cache decrypted TLS session frames", "Datagrams bypass congestion control windows"], true),
  q("ultra-advanced", "Architecture", 91, "What do idempotency keys prevent in distributed payment APIs?", "Duplicate charges", ["Skipping TLS certificate verification checks", "Compressing relational schemas across regions", "Bypassing rate limits during burst traffic"], true),
  q("ultra-advanced", "Distributed Systems", 92, "What threat model does Byzantine Fault Tolerance (BFT) handle?", "Malicious nodes", ["Clean crash-stop restarts on servers", "Clock drift under five milliseconds", "Single-sector CRC disk read failures"], true),
  q("ultra-advanced", "Distributed Systems", 94, "How many total nodes does PBFT need to tolerate f Byzantine faults?", "3f + 1", ["2f + 1 quorum nodes", "f + 1 backup nodes", "4f replica nodes"], true),
];

const ALL_RAW = [
  ...JUNIOR_QUESTIONS,
  ...NEW_JUNIOR_QUESTIONS,
  ...EXTRA_JUNIOR_25,
  ...SEMI_SENIOR_QUESTIONS,
  ...NEW_SEMI_SENIOR_QUESTIONS,
  ...EXTRA_SEMI_SENIOR_25,
  ...SENIOR_QUESTIONS,
  ...NEW_SENIOR_QUESTIONS,
  ...EXTRA_SENIOR_25,
  ...ULTRA_ADVANCED_QUESTIONS,
  ...NEW_ULTRA_ADVANCED_QUESTIONS,
  ...EXTRA_ULTRA_ADVANCED_25,
];

function promptKey(prompt) {
  return prompt
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const STOP_WORDS = new Set([
  "which", "what", "when", "where", "why", "how", "who", "does", "do", "did",
  "is", "are", "was", "were", "can", "could", "would", "should", "must",
  "the", "a", "an", "in", "on", "at", "of", "for", "to", "from", "by", "with",
  "into", "about", "across", "among", "between", "under", "over", "than",
  "and", "or", "not", "only", "that", "this", "these", "those", "it", "its",
  "one", "two", "using", "used", "use", "make", "makes", "called", "mean",
  "means", "stand", "computer", "computers", "data", "system", "file", "files",
]);

function contentTokens(text) {
  return new Set(
    promptKey(text)
      .split(" ")
      .filter((tok) => tok.length > 1 && !STOP_WORDS.has(tok)),
  );
}

function deriveEstimatedSeconds(prompt, options) {
  const totalWords =
    prompt.trim().split(/\s+/).length +
    options.reduce((sum, option) => sum + option.trim().split(/\s+/).length, 0);
  return Math.max(6, Math.min(14, 5 + Math.ceil(totalWords / 22)));
}

const counters = { junior: 0, "semi-senior": 0, senior: 0, "ultra-advanced": 0 };
const seenPrompts = new Map();
const positionalRegex = /\b(all of the above|none of the above|both a and b|both b and c|all of these|none of these)\b/i;

const questions = ALL_RAW.map((item) => {
  counters[item.level] += 1;
  const idx = counters[item.level];
  const prefix =
    item.level === "junior"
      ? "jr"
      : item.level === "semi-senior"
        ? "ss"
        : item.level === "senior"
          ? "sr"
          : "ua";
  const id = `${prefix}-${String(idx).padStart(3, "0")}`;

  const key = promptKey(item.prompt);
  if (seenPrompts.has(key)) {
    throw new Error(`Duplicate prompt detected: "${item.prompt}" vs "${seenPrompts.get(key)}"`);
  }
  seenPrompts.set(key, id);

  if (new Set(item.options).size !== 4) {
    throw new Error(`Duplicate option in ${id}: ${item.prompt}`);
  }
  if (!item.options.includes(item.answer)) {
    throw new Error(`Answer not in options for ${id}: ${item.prompt}`);
  }
  if (item.options.some((opt) => positionalRegex.test(opt))) {
    throw new Error(`Positional option detected in ${id}: ${item.prompt}`);
  }

  const optionObjs = item.options.map((text, optIdx) => ({
    id: `${id}-o${optIdx + 1}`,
    text,
  }));
  const correctOptionIndex = item.options.indexOf(item.answer);

  return {
    id,
    prompt: item.prompt,
    originalPrompt: item.prompt,
    topic: item.topic,
    difficulty: item.difficulty,
    estimatedSeconds: deriveEstimatedSeconds(item.prompt, item.options),
    type: "mcq",
    options: optionObjs,
    correctOptionId: optionObjs[correctOptionIndex].id,
    gradeBands: [item.level],
    sourceBank: item.level,
    sourceIndex: idx,
    calibrationStatus: "provisional",
    reviewFlags: [],
    eligibleForPlay: true,
    bossEligible: Boolean(item.bossEligible),
    tags: [item.level],
    originalAnswer: item.answer,
  };
});

const similarityWarnings = [];
for (let i = 0; i < questions.length; i += 1) {
  const a = questions[i];
  const aTokens = contentTokens(a.prompt);
  const aAns = promptKey(a.originalAnswer);
  for (let j = i + 1; j < questions.length; j += 1) {
    const b = questions[j];
    const bTokens = contentTokens(b.prompt);
    let shared = 0;
    for (const t of aTokens) {
      if (bTokens.has(t)) shared += 1;
    }
    const union = aTokens.size + bTokens.size - shared;
    const jaccard = union > 0 ? shared / union : 0;
    const bAns = promptKey(b.originalAnswer);
    const sameAns = aAns === bAns && aAns.length > 2;
    if (jaccard >= 0.55 || (sameAns && shared >= 2)) {
      similarityWarnings.push({
        a: `${a.id}: ${a.prompt} [${a.originalAnswer}]`,
        b: `${b.id}: ${b.prompt} [${b.originalAnswer}]`,
        jaccard: Number(jaccard.toFixed(2)),
        sameAns,
      });
    }
  }
}

const levelStats = {};
for (const level of ["junior", "semi-senior", "senior", "ultra-advanced"]) {
  const qs = questions.filter((item) => item.gradeBands.includes(level));
  const charRanks = [0, 0, 0, 0];
  const wordRanks = [0, 0, 0, 0];
  let bossCount = 0;

  for (const item of qs) {
    if (item.bossEligible) bossCount += 1;
    const corr = item.options.find((o) => o.id === item.correctOptionId);
    const cChar = corr.text.trim().length;
    const cWord = corr.text.trim().split(/\s+/).length;
    const sortedChar = item.options.map((o) => o.text.trim().length).sort((a, b) => b - a);
    const sortedWord = item.options.map((o) => o.text.trim().split(/\s+/).length).sort((a, b) => b - a);
    charRanks[sortedChar.indexOf(cChar)] += 1;
    wordRanks[sortedWord.indexOf(cWord)] += 1;
  }

  levelStats[level] = {
    total: qs.length,
    bossCount,
    charRanksLongestToShortest: charRanks,
    wordRanksLongestToShortest: wordRanks,
    longestCharPct: Number(((charRanks[0] / qs.length) * 100).toFixed(1)),
    shortestCharPct: Number(((charRanks[3] / qs.length) * 100).toFixed(1)),
  };
}

if (similarityWarnings.length > 0) {
  console.warn("SIMILARITY WARNINGS:", JSON.stringify(similarityWarnings, null, 2));
}

const diagnostics = {
  classificationStatus: "curated-cbse-level-separated-balanced",
  importedCount: questions.length,
  sourceCounts: counters,
  excludedFromPlay: 0,
  flaggedCount: similarityWarnings.length,
  promptDuplicateGroups: 0,
  flaggedQuestions: [],
  levelStats,
};

await writeFile(
  outputPath,
  `${JSON.stringify({ questions, diagnostics }, null, 2)}\n`,
  "utf8",
);

console.log("Generated curated offline question database:", outputPath);
console.log("Total questions:", questions.length);
console.log("Similarity warnings:", similarityWarnings.length);
console.log("Level audit:", JSON.stringify(levelStats, null, 2));


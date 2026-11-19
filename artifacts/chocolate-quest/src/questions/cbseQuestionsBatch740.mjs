function q(level, topic, difficulty, prompt, answer, distractors, bossEligible = false) {
  return { level, topic, difficulty, prompt, answer, options: [answer, ...distractors], bossEligible };
}

// +25 unique CBSE Class 7–8 (Computer Science / ICT / AI Foundations)
// Ranks balanced across 25 items: 0..5 rank 0, 6..11 rank 1, 12..17 rank 2, 18..24 rank 3
export const EXTRA_JUNIOR_25 = [
  // 0..5: rank 0 (answer longest)
  q("junior", "Keyboard & Typing", 23, "Which key moves the cursor directly to the start of the current line?", "Home navigation key", ["End button", "Tab stop", "Shift key"]),
  q("junior", "Hardware", 25, "Which audio device converts digital computer sound signals into audible waves?", "External speakers", ["Webcam lens", "Stylus pen", "USB hub"]),
  q("junior", "Memory & Storage", 27, "How does a Blu-ray disc store far more video than a DVD of the same physical size?", "Shorter blue-violet laser", ["Thicker plastic slab", "Spinning backward", "Magnetic coating"]),
  q("junior", "Spreadsheets", 29, "What happens inside a spreadsheet when text in cell A1 is wider than column A and B1 is filled?", "Display truncates cleanly", ["Text deletes itself", "Sheet closes fast", "Font turns white"]),
  q("junior", "Cyber Safety", 31, "What kind of unwanted bulk commercial email floods inboxes automatically?", "Unsolicited spam messages", ["Signed school notices", "Firmware updates", "System clock"]),
  q("junior", "AI Foundations", 33, "Which everyday map feature relies on AI traffic prediction to suggest faster detours?", "Smart navigation routing", ["Static paper atlas", "Manual compass", "Slide theme"]),

  // 6..11: rank 1 (1 distractor longer, 2 shorter)
  q("junior", "Keyboard & Typing", 24, "Which keyboard key capitalizes letters continuously until toggled off again?", "Caps Lock", ["Backspace clear previous key", "Spacebar", "Alt key"]),
  q("junior", "Word Processing", 27, "Which formatting style raises small characters like the 2 in 5² above the baseline?", "Superscript", ["Strikethrough gray font line", "Subscript", "Underline"]),
  q("junior", "File Management", 28, "Which Windows shortcut selects every file or word inside the active window?", "Ctrl + A", ["Ctrl + D bookmark web page", "Ctrl + E", "Ctrl + L"]),
  q("junior", "Multimedia", 30, "Which compressed digital audio file format is standard for storing music tracks?", ".mp3 audio", [".docx formatted paper file", ".xlsx sheet", ".png"]),
  q("junior", "Networking", 32, "What quick laptop setting switches off Wi-Fi, Bluetooth, and cellular radios together?", "Airplane Mode", ["Battery Saver brightness dim", "Night Light", "Sleep"]),
  q("junior", "Scratch Coding", 34, "Which Scratch block moves a sprite smoothly to a chosen spot over a set duration?", "Glide block", ["Play sound drum instrument note", "Hide sprite", "Wait 1s"]),

  // 12..17: rank 2 (2 distractors longer, 1 shorter)
  q("junior", "Hardware", 28, "What standard measures how many billions of cycles per second a CPU executes?", "Gigahertz (GHz)", ["Dots Per Inch print precision grid", "Pixels Per Square Display Screen", "Volts"]),
  q("junior", "Hardware", 30, "What does DPI measure when comparing printers or optical gaming mice?", "Precision dots", ["Gigabytes stored on backup disks", "Total electrical watts from PSU", "Hertz"]),
  q("junior", "Word Processing", 31, "Which document setting sets the blank white space around all four edges of a page?", "Page margins", ["Automated table of headings list", "Paragraph line indentation mark", "Tab key"]),
  q("junior", "Operating Systems", 32, "Where do deleted Windows files wait before you empty them permanently?", "Recycle Bin", ["Read-Only BIOS startup flash chip", "Active CPU instruction buffer", "Taskbar"]),
  q("junior", "Presentations", 34, "What keeps speaker reminders hidden from the audience during a classroom slide show?", "Speaker Notes", ["Public full-screen backdrop theme", "Automatic slide fade transition", "Gridlines"]),
  q("junior", "Flowcharts", 35, "What standard flowchart box encloses processing calculations like Total = Price * Qty?", "Rectangle box", ["Oval terminal capsule shape outline", "Double-walled diamond test gate", "Dot"]),

  // 18..24: rank 3 (answer shortest, mostly Boss)
  q("junior", "Number Systems", 36, "Which base-8 number system uses only digits from 0 through 7?", "Octal", ["Hexadecimal sixteen", "Decimal ten base", "Binary two state"], true),
  q("junior", "Word Processing", 37, "Which native file extension belongs to LibreOffice Writer documents?", ".odt", [".odp slide show file", ".ods spreadsheet sheet", ".csv comma table"], true),
  q("junior", "File Management", 38, "Which keyboard shortcut saves your current document work immediately?", "Ctrl + S", ["Ctrl + X cut text out", "Ctrl + F search words", "Ctrl + N fresh page"], true),
  q("junior", "Web Basics", 39, "Which HTML tag builds an unordered bulleted list?", "<ul>", ["<ol> numbered sequence", "<table> cell matrix", "<form> input box"], true),
  q("junior", "Hardware", 40, "What type of memory inside a motherboard holds clock settings with a coin battery?", "CMOS", ["Hard platter disk drive", "Optical DVD disc reader", "Thermal heatsink paste"], true),
  q("junior", "Cyber Safety", 41, "What small security software checks each message and blocks fake website links?", "Phishing filter", ["Screen contrast balancer", "Spreadsheet macro runner", "Optical zoom enlarger"], true),
  q("junior", "AI Foundations", 43, "Which AI field enables apps to recognize spoken commands and convert speech to text?", "Speech AI", ["Static bitmap coloring", "Hardware BIOS booting", "Magnetic disk sorting"], true),
];

// +25 unique CBSE Class 9–10 (IT Code 402 & Computer Applications Code 165)
// Ranks balanced across 25 items: 0..5 rank 0, 6..11 rank 1, 12..17 rank 2, 18..24 rank 3
export const EXTRA_SEMI_SENIOR_25 = [
  // 0..5: rank 0 (longest)
  q("semi-senior", "IT 402 Communication", 44, "In the communication cycle, what confirms the receiver understood the sender's message?", "Clear constructive feedback", ["Loud background static", "Missing context", "One-way broadcast"]),
  q("semi-senior", "IT 402 Self Management", 45, "Which skill helps students finish high-impact tasks before deadlines without panic?", "Effective time management", ["Constant multitasking", "Skipping breaks", "Last-minute rush"]),
  q("semi-senior", "IT 402 Documentation", 47, "In LibreOffice Writer, why place a document title inside the Header instead of normal body text?", "Repeats cleanly across pages", ["Shrinks word count", "Deletes page breaks", "Locks fonts"]),
  q("semi-senior", "IT 402 Spreadsheets", 49, "In Calc, why freeze the top row before scrolling down a 500-row student marksheet?", "Keeps column titles visible", ["Multiplies row totals", "Exports PDF sheets", "Clears colors"]),
  q("semi-senior", "Code 165 Web Services", 50, "Which Indian real-time payment network transfers bank funds instantly via mobile IDs?", "Unified Payments Interface", ["Postal paper order", "Static blog feed", "Bluetooth pair"]),
  q("semi-senior", "Code 165 CSS3", 52, "Which CSS pseudo-class applies visual styling while a mouse pointer rests over a button?", ":hover state style", [":nth-child()", "::before tag", ":root rule"]),

  // 6..11: rank 1 (1 longer, 2 shorter)
  q("semi-senior", "IT 402 Documentation", 48, "Which keyboard shortcut pastes copied text in Writer without keeping its original website fonts?", "Ctrl + Shift + V", ["Ctrl + Alt + Delete reset", "Ctrl + V", "Ctrl + K"]),
  q("semi-senior", "IT 402 Spreadsheets", 50, "Which Calc feature highlights failing scores automatically in red based on a numeric rule?", "Conditional Format", ["Manual single-cell font color", "Split Screen", "Page Break"]),
  q("semi-senior", "IT 402 RDBMS", 52, "In LibreOffice Base, which object lets non-technical staff enter records neatly field by field?", "Database Form", ["Raw SQL DDL Schema Export", "Report sheet", "Table lock"]),
  q("semi-senior", "Code 165 HTML5", 51, "Which HTML tag adds a centered descriptive caption directly atop a <table>?", "<caption>", ["<colgroup> style wrapper tag", "<thead>", "<summary>"]),
  q("semi-senior", "Code 165 Python", 53, "Which built-in Python function returns the absolute non-negative magnitude of a number?", "abs(x)", ["round(num) nearest value", "pow(a, b)", "int(x)"]),
  q("semi-senior", "Code 165 Cyber Ethics", 54, "Which online crime steals someone's personal details to open accounts in their name?", "Identity theft", ["Routine open-source code review", "Ad blocking", "Spam filter"]),

  // 12..17: rank 2 (2 longer, 1 shorter)
  q("semi-senior", "IT 402 Green Skills", 49, "Which clean energy technology converts sunlight directly into electricity on rooftops?", "Solar PV", ["Subsurface coal-fired steam engine", "Heavy diesel portable generator", "Gas fuel"]),
  q("semi-senior", "IT 402 Spreadsheets", 53, "What Calc tool cross-tabulates thousands of sales rows by summing categories interactively?", "Pivot Table", ["Plain unsorted manual entry log", "Static cell border line theme", "Wrap"]),
  q("semi-senior", "IT 402 RDBMS", 54, "How does SQL's CHAR(10) data type store a 4-letter code compared to VARCHAR(10)?", "Pads spaces", ["Drops extra letters silently fast", "Compresses text strings to binary", "Sorts"]),
  q("semi-senior", "Code 165 HTML5", 52, "Which HTML5 element embeds video clips natively with play and volume controls?", "<video>", ["<embed> legacy plugin frame tag", "<marquee> scrolling banner box", "<img>"]),
  q("semi-senior", "Code 165 CSS3", 55, "Which CSS property controls which overlapping positioned element sits visually on top?", "z-index", ["text-overflow clipping dots rule", "letter-spacing wide font track", "opacity"]),
  q("semi-senior", "Code 165 Python", 55, "Which Python branch keyword checks an extra condition only if earlier branches failed?", "elif", ["elseif curly-brace C conditional", "otherwise fallback loop branch", "else"]),

  // 18..24: rank 3 (shortest, mostly Boss)
  q("semi-senior", "IT 402 Entrepreneurship", 55, "What written roadmap outlines a startup's market, costs, and revenue model?", "Business plan", ["Daily classroom attendance log", "Hardware warranty receipt", "Simple software user guide"], true),
  q("semi-senior", "IT 402 Documentation", 56, "Which faint diagonal background word like 'DRAFT' sits behind document text?", "Watermark", ["Footnotes citation line", "Drop-cap initial letter", "Header margin bar text"], true),
  q("semi-senior", "IT 402 Spreadsheets", 57, "Which Calc lookup function searches the first column of a range vertically for a match?", "VLOOKUP", ["SUMPRODUCT matrix multiply", "COUNTBLANK empty cells", "TRIM trailing blanks"], true),
  q("semi-senior", "IT 402 RDBMS", 58, "Which SQL constraint validates that entered values satisfy a rule like Marks >= 0?", "CHECK", ["DEFAULT fallback value", "UNIQUE column entries", "INDEX fast B-tree key"], true),
  q("semi-senior", "Code 165 HTML5", 58, "Which HTML tag pairs with <dt> and <dd> to build a glossary description list?", "<dl>", ["<ul> bulleted item list", "<ol> ordered items", "<hr> section rule"], true),
  q("semi-senior", "Code 165 Networking", 59, "Which default TCP port does standard File Transfer Protocol (FTP) control traffic use?", "Port 21", ["Port 443 encrypted web", "Port 53 DNS domain", "Port 25 SMTP email"], true),
  q("semi-senior", "Code 165 Cyber Ethics", 60, "Which unwanted software silently floods your desktop screen with promotional popups?", "Adware", ["Encrypted password vault", "Open-source GNU compiler", "Read-only disk backup"], true),
];

// +25 unique CBSE Class 11–12 Informatics Practices (065) & Computer Science (083)
// Ranks balanced across 25 items: 0..5 rank 0, 6..11 rank 1, 12..17 rank 2, 18..24 rank 3
export const EXTRA_SENIOR_25 = [
  // 0..5: rank 0 (longest)
  q("senior", "CS 083 Digital Logic", 60, "In binary arithmetic, how do computers cleanly encode negative signed integers for addition?", "Two's complement form", ["Floating mantissa", "ASCII minus sign", "Octal shift"]),
  q("senior", "CS 083 Python", 62, "What error strikes if a recursive Python function lacks a reachable base stopping case?", "RecursionError depth hit", ["KeyError lookup", "ZeroDivision", "ImportError"]),
  q("senior", "CS 083 Python", 63, "Why does trying word[0] = 'J' on a Python string raise a TypeError?", "Strings are immutable", ["Brackets need sets", "Index starts at 1", "Strings lack len"]),
  q("senior", "CS 083 Data Structures", 65, "How does a Circular Queue solve wasted empty slots in a fixed-size array queue?", "Wraps rear modulo capacity", ["Sorts items on push", "Doubles ints blindly", "Pops from middle"]),
  q("senior", "CS 083 SQL & Connector", 64, "How should you pass user variables into cursor.execute() in Python to block SQL injection?", "Use parameterized %s tuple", ["Concatenate with +", "Encode Base64", "Sort strings"]),
  q("senior", "IP 065 Pandas", 63, "What summary report does df.describe() compute by default for numeric DataFrame columns?", "Count, mean, std, quartiles", ["Column SQL types only", "Pie chart colors", "Index duplicates"]),

  // 6..11: rank 1 (1 longer, 2 shorter)
  q("senior", "CS 083 Digital Logic", 63, "Which Boolean combinational circuit outputs Sum = A XOR B and Carry = A AND B?", "Half Adder", ["Two-bit Magnitude Comparator", "Multiplexer", "Decoder"]),
  q("senior", "CS 083 Character Sets", 64, "Which variable-width encoding uses 1 to 4 bytes per character and stays ASCII-compatible?", "UTF-8", ["Fixed 32-bit UTF-32 code unit", "ISCII", "EBCDIC"]),
  q("senior", "CS 083 Python", 65, "Which Python keyword creates an inline one-line anonymous function without def?", "lambda", ["generator yielding object block", "global", "async"]),
  q("senior", "CS 083 Python", 66, "In Python, which try-statement clause executes reliably whether or not an exception arose?", "finally", ["except CatchAll error handler", "else", "assert"]),
  q("senior", "CS 083 SQL & Connector", 65, "Which SQL join retains every left-table row even if no right-table match exists?", "LEFT JOIN", ["INNER intersection join filter", "CROSS JOIN", "SELF"]),
  q("senior", "IP 065 Matplotlib", 66, "Which Matplotlib function draws paired numeric dots to expose correlation trends?", "plt.scatter()", ["plt.hist() frequency distribution", "plt.bar()", "plt.pie()"]),

  // 12..17: rank 2 (2 longer, 1 shorter)
  q("senior", "CS 083 Python", 65, "What is the key difference between copy.copy(a) and copy.deepcopy(a) on nested lists?", "Clones inner lists", ["Deepcopy skips top-level list copy", "Shallow duplicates nested dicts too", "Same speed"]),
  q("senior", "CS 083 Python", 67, "In a Python function signature def log(*args), what collection type does args receive?", "Tuple of args", ["Unordered unique Python hash set", "Mutable key-value Python dict", "List"]),
  q("senior", "CS 083 Data Structures", 68, "Which linear structure lets you insert and remove elements smoothly from BOTH ends?", "Deque", ["Strictly LIFO single-ended stack", "Singly linked tail-only queue", "Heap"]),
  q("senior", "CS 083 SQL & Connector", 67, "How does TRUNCATE TABLE differ from DELETE FROM when emptying a big MySQL table?", "Fast DDL reset", ["Can roll back deleted rows easily", "Fires per-row DELETE triggers", "Slow scan"]),
  q("senior", "CS 083 Networks", 68, "How did classic 10BASE Ethernet hubs manage wire collisions when two PCs spoke at once?", "CSMA/CD", ["Token passing static ring wait", "Dedicated switched optical fiber", "OSPF"]),
  q("senior", "IP 065 Pandas", 68, "Which Pandas function stacks two DataFrames with matching columns vertically row-wise?", "pd.concat()", ["df.transpose() axis swap flip", "df.dropna() remove missing NaN", "df.T"]),

  // 18..24: rank 3 (shortest, mostly Boss)
  q("senior", "CS 083 Python", 69, "Which Python keyword turns a function into a lazy memory-efficient iterator generator?", "yield", ["return final scalar", "continue next step", "import module file"], true),
  q("senior", "CS 083 File Handling", 70, "Which Python file method forces buffered output bytes straight onto disk before close?", "flush()", ["truncate() cut size", "tell() byte pointer", "seek() offset move"], true),
  q("senior", "CS 083 SQL & Connector", 71, "Which SQL pattern LIKE '_a%' matches in a Student Name column?", "2nd letter a", ["Starts with letter a", "Ends with letter a", "Exact string _a%"], true),
  q("senior", "CS 083 Networks", 72, "What unit measures discrete signal changes per second vs raw bits per second?", "Baud rate", ["Channel hertz span", "Packet window size", "Hop TTL timeout"], true),
  q("senior", "IP 065 Pandas", 72, "In Pandas, which rows does df.iloc[1:4] select from a DataFrame?", "Rows 1, 2, 3", ["Rows 1, 2, 3, 4", "Only rows 1 and 4", "Label '1' to '4'"], true),
  q("senior", "IP 065 MySQL Functions", 73, "Which MySQL date function computes the whole-day count between two dates?", "DATEDIFF()", ["MONTHNAME() text", "DAYOFWEEK() index", "CURTIME() clock"], true),
  q("senior", "IP 065 Societal Impacts", 75, "Which workplace design science fits chair height, screen angle, and wrists to users?", "Ergonomics", ["Active packet sniffing", "Brute-force hashing", "Automated web scraping"], true),
];

// +25 unique B.Tech / Engineering CS & Systems
// Ranks balanced across 25 items: 0..5 rank 0, 6..11 rank 1, 12..17 rank 2, 18..24 rank 3
export const EXTRA_ULTRA_ADVANCED_25 = [
  // 0..5: rank 0 (longest)
  q("ultra-advanced", "Operating Systems", 82, "How does a Multi-Level Feedback Queue scheduler prevent starvation of long CPU-bound tasks?", "Boosts waiting tasks via aging", ["Locks cores statically", "Drops low-prio PIDs", "Stops preemption"]),
  q("ultra-advanced", "Operating Systems", 84, "Why do 64-bit OS kernels use Inverted Page Tables on ultra-large virtual address spaces?", "Sizes table to physical RAM", ["Doubles per-process L1", "Skips TLB hits", "Drops swaps"]),
  q("ultra-advanced", "Computer Architecture", 85, "How does Tomasulo's dynamic scheduling resolve structural and false hazards out-of-order?", "Reservation stations rename tags", ["Freezes entire pipeline", "Unrolls static loops", "Skips ALUs"]),
  q("ultra-advanced", "DBMS Internals", 86, "How does Serializable Snapshot Isolation (SSI) improve concurrency over Strict 2PL?", "Detects rw-conflict cycles lock-free", ["Blocks all reader locks", "Drops redo logs", "Forces 1 core"]),
  q("ultra-advanced", "Networking Internals", 85, "What internet routing setup lets users reach the geographically nearest CDN edge sharing one IP?", "BGP Anycast announcements", ["Round-robin DNS TTL", "ARP proxies", "Static NAT"]),
  q("ultra-advanced", "Distributed Systems", 88, "What data structure lets replicas accept offline concurrent edits and merge without conflicts?", "CRDT merge semilattice", ["Global 2PC lock", "Manual git merge", "Single master"]),

  // 6..11: rank 1 (1 longer, 2 shorter)
  q("ultra-advanced", "Operating Systems", 84, "What separates a minor page fault from a major page fault in Linux virtual memory?", "No disk I/O", ["Requires full synchronous NVMe read", "Kills PID", "Flushes L2"]),
  q("ultra-advanced", "Computer Architecture", 86, "Which cache coherence protocol labels lines Modified, Exclusive, Shared, or Invalid?", "MESI protocol", ["Peterson Bakery mutex lock", "Write-Through", "Round Robin"]),
  q("ultra-advanced", "Networking Internals", 87, "Which TCP option lets receivers report non-contiguous received blocks after packet loss?", "Selective Acknowledgment", ["Slow-Start Exponential Congestion Probe", "ARP Cache", "TTL hop"]),
  q("ultra-advanced", "Algorithms", 86, "What condition guarantees the A* heuristic pathfinder finds an optimal shortest path?", "Admissible heuristic", ["Exponential depth-first branching", "Negative edge", "Greedy step"]),
  q("ultra-advanced", "Cryptography", 87, "Why does comparing HMAC tags with == instead of constant-time comparison leak secrets?", "Timing side-channel", ["Allows attackers to forge RSA primes", "Doubles AES", "Fills RAM"]),
  q("ultra-advanced", "Compilers", 88, "Which lattice framework computes facts like live variables across a Control Flow Graph?", "Data-flow analysis", ["LL recursive descent token scanning", "Static linking", "AST parse"]),

  // 12..17: rank 2 (2 longer, 1 shorter)
  q("ultra-advanced", "DBMS Internals", 86, "How does an In-Memory Hash Join execute when joining two large unindexed tables?", "Build & probe", ["Nested full-disk O(N*M) loop scan", "Merge-sorts both sets on tape", "B-tree split"]),
  q("ultra-advanced", "Networking Internals", 88, "What TCP timer breaks deadlock if a receiver advertises zero window and its reopen ACK drops?", "Persist timer", ["Exponential BGP hold-down timer", "Stateless ICMP echo timeout", "TTL hop"]),
  q("ultra-advanced", "Networking Internals", 89, "Why does Bufferbloat degrade video calls even when broadband download bandwidth looks high?", "Oversized queues", ["Zero packet queues dropping frames", "Short optical fiber cable runs", "DNS misses"]),
  q("ultra-advanced", "Algorithms", 87, "How much extra memory does Floyd's Tortoise and Hare algorithm need to detect a linked-list cycle?", "O(1) space", ["O(n) hash set storing visited nodes", "O(log n) recursive stack calls", "O(n^2)"]),
  q("ultra-advanced", "Theory of Computation", 89, "How does an NP-hard problem formally differ from an NP-complete problem?", "Needn't be in NP", ["Always runs strictly in poly time", "Must be decidable in log space", "Solves SAT"]),
  q("ultra-advanced", "Distributed Systems", 90, "Which consistency model requires every operation appear atomic between its real-time call and return?", "Linearizability", ["Relaxed conflict-free eventual", "Serializability ignoring wall time", "Causal lag"]),

  // 18..24: rank 3 (shortest, mostly Boss)
  q("ultra-advanced", "Operating Systems", 89, "Which Linux sync primitive avoids kernel syscalls completely unless lock contention occurs?", "futex", ["Spinning busy-loop poll", "Slow SysV semaphore", "Named FIFO disk pipe"], true),
  q("ultra-advanced", "Algorithms", 90, "Roughly what exponent replaces n^3 in Strassen's recursive matrix multiplication?", "n^2.81", ["n^3.5 cubic step", "n log n bound", "n^2 linear pass"], true),
  q("ultra-advanced", "Algorithms", 91, "In Tarjan's graph bridge finder, what edge (u, v) qualifies as a bridge?", "low[v] > tin[u]", ["low[v] <= tin[u]", "tin[v] < tin[u]", "deg(v) > 2 edge"], true),
  q("ultra-advanced", "Theory of Computation", 92, "Which theorem proves deterministic space can simulate nondeterministic space squared?", "Savitch's", ["Cook-Levin NP proof", "Rice semantic check", "Pumping regular"], true),
  q("ultra-advanced", "Cryptography", 92, "Which key exchange property ensures past recorded TLS traffic stays safe if server keys leak later?", "Forward secrecy", ["Static RSA key wraps", "ECB block padding", "Short 64-bit nonces"], true),
  q("ultra-advanced", "Cryptography", 93, "Which hash-based tree lets light blockchain clients verify inclusion in O(log n) hashes?", "Merkle tree", ["Unordered hash table", "Dense adjacency matrix", "FIFO circular queue"], true),
  q("ultra-advanced", "Distributed Systems", 94, "Which algorithm records a consistent global snapshot across distributed nodes using marker messages?", "Chandy-Lamport", ["Two-Phase Commit lock", "Greedy Kruskal forest", "Bellman distance pass"], true),
];

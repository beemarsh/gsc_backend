## Database Configuration

  

This application uses MySQL as its database. We utilize the `mysql2` library for connecting to the database and executing queries.

  

*  **`mysql2` Library:** The `mysql2` library provides a promise-based API for interacting with MySQL databases, making it easier to use with `async/await`. It is imported by any file that requires database connectivity. This approach promotes code reusability and simplifies database interactions throughout the application.

  

*  **Connection Pooling:** To optimize database performance and resource utilization, we employ connection pooling. The `mysql2.createPool()` method is used to create a pool of database connections that can be reused across multiple requests. This reduces the overhead of establishing new connections for each query.

  

*  **Environment Variables:** For enhanced security and portability, all database connection parameters (host, user, password, database name) are stored in environment variables. This prevents sensitive information from being hardcoded in the application's source code and allows for easy configuration in different environments.

  

*  **Security:** Storing database credentials in environment variables is a crucial security practice. It prevents accidental exposure of sensitive information in version control systems or configuration files.

*  **Portability:** Using environment variables makes it easy to deploy the application in different environments (e.g., development, staging, production) without modifying the code.

  

## Middlewares

  

Middlewares are essential components of the application that automate common tasks and enhance security.

  

### Error Handling Middleware

  

Errors are inevitable in web applications, and proper error handling is crucial for providing a good user experience and maintaining application stability. To address this, we have implemented a custom error handling middleware.

  

*  **`RouteError` Class:** We have extended the built-in `Error` class to create a custom `RouteError` class. This class allows us to encapsulate additional information about the error, such as the HTTP status code and any relevant details.

  

*  **Centralized Error Logging:** The error handling middleware logs all errors in a single location, making it easier to debug and monitor the application.

  

*  **Customizable Error Responses:** The middleware allows us to customize the error responses that are sent to the client. This includes setting the appropriate HTTP status code and providing a user-friendly error message.

  

*  **Debugging Information:** We have implemented a mechanism to include more detailed error information in the response when the application is running in debug mode. This can be helpful for developers when troubleshooting issues.

  

*  **Simplified Error Handling:** By using this middleware, we can simplify error handling in our route handlers. Instead of having to write repetitive error handling code in each route, we can simply throw a `RouteError` and let the middleware handle the rest.

  

### Not Found Middleware

  

The `notFound` middleware handles requests for routes that do not exist. It returns a 404 Not Found error to the client.

  

### Verify Middleware (Important for Authentication)

  

This middleware is the **central and most critical component of our authentication system**, designed and implemented with the utmost care and attention to security best practices. It acts as a gatekeeper for protected routes, ensuring that only authenticated users can access them.

  

**Key Security Features:**

  

*  **Token Extraction:** The middleware begins by extracting the access token from the `Authorization` header (typically in the format `Bearer <token>`) and the refresh token from the `refreshToken` cookie. This separation of tokens into different storage locations is a deliberate security measure.

*  **Access Token Verification:** The access token is then verified using `jwt.verify()` with a secret key (`JWT_SECRET`). This process confirms the token's integrity and ensures that it has not been tampered with. If the access token is valid (i.e., it hasn't expired and the signature is correct), the middleware attaches the decoded user information (typically user ID and email) to the `req.user` object. This makes the user's identity readily available to subsequent route handlers.

*  **Refresh Token Handling (Automatic Access Token Renewal):** If the access token has expired (a common occurrence), the middleware intelligently attempts to refresh it using the refresh token. This process is transparent to the user and provides a seamless experience.

*  **Refresh Token Lookup:** The middleware queries the database to find a refresh token matching the one provided in the cookie. This ensures that the refresh token is valid and hasn't been revoked.

*  **User Details Retrieval:** Upon successful refresh token verification, the middleware retrieves the user's details from the database. This step is crucial to ensure that the user account is still active and hasn't been disabled or deleted.

*  **New Token Generation:** The middleware generates a new access token and a new refresh token for the user.

*  **Refresh Token Rotation:** To enhance security, the old refresh token is invalidated (deleted from the database), and the new refresh token is stored in the database and set as an HTTP-only cookie. This practice, known as refresh token rotation, limits the potential damage if a refresh token is compromised. An attacker with a stolen refresh token can only use it once.

*  **HTTP Only Cookies (Protection Against XSS):** The refresh token is stored in an HTTP-only cookie. This is a critical security measure that prevents client-side JavaScript code from accessing the token. This effectively mitigates the risk of cross-site scripting (XSS) attacks, where malicious scripts injected into the website could steal the token.

*  **Centralized Authentication Logic:** This middleware encapsulates all the complex logic related to token verification, refresh token handling, and user authentication. This centralization simplifies the implementation of protected routes and promotes code reusability.

  

**Benefits for Developers (Abstraction of User Verification):**

  

*  **Simplified Route Handling:** Developers can focus on implementing the core logic of their routes without having to worry about the complexities of user authentication. The middleware handles all the necessary checks and ensures that only authenticated users can access the route.

*  **Automatic User Data Availability:** The middleware automatically attaches the user's information (from the access token) to the `req.user` object. This makes the user's identity readily available to the route handler, eliminating the need for repetitive database queries or authentication checks.

*  **Enhanced Security:** By centralizing the authentication logic in a single, well-tested middleware, we can ensure that all protected routes are secured consistently and that security best practices are followed.

*  **Reduced Code Duplication:** The middleware eliminates the need to duplicate authentication logic in multiple routes, reducing code duplication and improving maintainability.

 

  

## User Registration

  

This section describes the user registration process, highlighting security measures and implementation details.

  

The registration endpoint (`/register`) allows new users to create an account. It requires three inputs:

  

*  **Name:** The user's name (string, maximum 20 characters, alphanumeric characters and spaces only).

*  **Email:** The user's email address (string, must be a valid email format).

*  **Password:** The user's password (string, minimum 8 characters, must contain at least one uppercase letter, one lowercase letter, and one number).

  

### Input Validation and Sanitization

  

Input validation and sanitization are crucial for security. They help prevent SQL injection and Cross-Site Scripting (XSS) vulnerabilities. We implement the following measures:

  

*  **Data Type Validation:** Ensuring that the input values are of the expected data type (e.g., string).

*  **Length Validation:** Limiting the length of input values to prevent buffer overflows and other issues. The `name` field, for example, is limited to a maximum of 20 characters.

*  **Character Whitelisting:** Allowing only specific characters in input values. For the `name` field, we only allow alphanumeric characters and spaces. This prevents users from injecting malicious code or special characters that could cause problems.

*  **Implementation:** The `validator.whitelist()` function is used to remove any characters from the `name` that are not alphanumeric or whitespace. If the length of the sanitized name is different from the original name, it indicates that invalid characters were removed, and an error message is displayed.

  

By implementing these validation and sanitization techniques, we significantly reduce the risk of attackers injecting malicious code into our application.

  

### Database Connection and Prepared Statements

  

After validating the input, we connect to the database to store the user's information. To prevent SQL injection vulnerabilities, we use prepared statements (also known as parameterized queries).

  

Parameterized queries are the most effective way to prevent SQL injection. Instead of directly embedding user input into the SQL query string, we use placeholders (parameters) that are later bound to the actual values. The database driver then handles the proper escaping and quoting of the values, ensuring that they are treated as data and not as executable code.

  

*  **Implementation:** The `mysql2` package supports parameterized queries. The `connection.execute()` function is used to execute the query with placeholders, and the input values are passed as an array.

  

```javascript

const  sql = 'INSERT INTO auth (user_id, name, email, password) VALUES (?, ?, ?, ?)';

await  connection.execute(sql, [userId, name, email, hashedPassword]);

```

  

### Database Query and Error Handling

  

After connecting to the database, we execute the query to insert the user's information into the `auth` table.

  

* If the user already exists (duplicate email) or if there is some other database error, the user receives an appropriate error message.

* If the query is successful, the user is registered, and a success message is returned.

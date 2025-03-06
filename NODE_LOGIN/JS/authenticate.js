/* <?php
session_start();
require("includes/database.ini.php"); // Database connection

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = mysqli_real_escape_string($conn, $_POST['username']);
    $password = mysqli_real_escape_string($conn, $_POST['password']);

    $sql = "SELECT * FROM users WHERE username = '$username'";
    $result = mysqli_query($conn, $sql);
    $row = mysqli_fetch_assoc($result);

    if ($row) {
        // Verifies the hashed password)
        if (password_verify($password, $row['password'])) {
            $_SESSION['user_id'] = $row['id'];
            $_SESSION['username'] = $row['username'];
            header("Location: index.php"); // Redirect to index page
            exit();
        } else {
            echo "Incorrect password.";
        }
    } else {
        echo "No user found with that username.";
    }
}
?> */








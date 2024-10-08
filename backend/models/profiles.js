const sqlConn = require('./config');
const validator = require('validator'); // note move email and password validation to front end and just hash passwords in backend
const bcrypt = require('bcrypt');

async function createUser(userInfo) {
    if (!validator.isEmail(userInfo.email) || (userInfo.password).length < 7) {
        throw({message: "Invalid Credentials"}); // throw this instead of returning
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(userInfo.password, salt); // increase size of password to 255 Done
    
    try {
        let [ rows ] = await sqlConn.query(`
            INSERT INTO Profiles (email, password)
            VALUES (?, ?)
            `, [userInfo.email, hashedPassword]);
            
        let [ feedback ] = await sqlConn.query(`SELECT * FROM Profiles WHERE Email = ?`, [userInfo.email]);
        
        return feedback[0]; //feedback[0];
    }

    catch (err) {
        throw(err);
    }    

}


async function getProfiles() {
    let [ rows ] = await sqlConn.query("SELECT * FROM Profiles");
    return rows;
}

async function getProfileByID(id) {
    try {
        let [ row ] = await sqlConn.query(`
            SELECT Email FROM Profiles
            WHERE UserID=?`, [id]);
        
        return row[0].Email;
    }
    catch (err) {
        throw({message: "User Not Found"});
    }
}

// note await pauses the execution of the function until that line is finished
async function getProfileByEmail(userInfo) {
    
    let [ rows ] = await sqlConn.query(
        `SELECT * FROM Profiles 
        WHERE Email = ?`, userInfo.email);
    
    if (rows.length == 0) {
        throw({ message: "User not found" });
    }
    
    //console.log(userInfo.password, rows[0].Password); // sql columns are case sensitive

    const auth = await bcrypt.compare(userInfo.password, rows[0].Password);
    
    if (auth) {
        return {message: "User Logged In", userID: rows[0].UserID, userEmail: rows[0].Email};
    }
    else {
        throw({message: "Invalid Password"});
    }    
} 

async function changeUsername(userInfo) {}

async function changePassword(userInfo) {
    console.log("HERE");
    try {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(userInfo.password, salt);
        
        const feedback = await sqlConn.query(`
            UPDATE Profiles
            SET Password = ?
            WHERE Email = ?
        `, [hashedPassword, userInfo.email]);

        return feedback;
    }

    catch (err) {
        throw(err);
    }
}

async function deleteUser(userID) { 
    let feedback = await sqlConn.query(`
            DELETE FROM Profiles WHERE UserID=?
        `, [userID]);
    
    return feedback;
    // also delete items in Items Table with the corresponding userID
}


module.exports = { getProfiles, getProfileByEmail, getProfileByID, createUser, deleteUser, changePassword };
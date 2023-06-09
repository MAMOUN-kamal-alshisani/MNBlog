import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { validateSignUp } from "../middleware/validator.js";
import dotenv from "dotenv";
dotenv.config();

/// for user authorization
function createToken(id) {
  return jwt.sign({ id: id }, process.env.SECRET);
}

//// signup 
export async function signup(req, res) {
  try {
    const { error, value } = validateSignUp(req.body);
    if (error) {
      res.status(403).send(error);


    } else {
      const { UserName, Email } = req.body;
      const userEmail = await User.findOne({ where: { Email: Email } });

      if (userEmail)
        return res.status(409).send([{ message: "email already in use!" }]);

      const genSalt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(req.body.Password, genSalt);
      const newUser = await User.create({
        UserName: UserName,
        Email: Email,
        Password: hashedPassword,
      });

      res.status(200).send({ message: "user has signed up successfully!" });
    }
  } catch (err) {
    res.status(404).send(err);
  }
}

//// signin
export async function signin(req, res) {
  try {
    const user = await User.findOne({ where: { Email: req.body.Email } });
    if (!user) return res.status(401).send("email is invalid!");

    const validPassword = await bcrypt.compare(
      req.body.Password,
      user.Password
    );
    if (!validPassword)
      return res.status(401).send("password or email is incorrect!");

    const token = createToken(user.id);

    const { Password, ...details } = user.toJSON();
    res
      .cookie("token", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
        secure: true
      })
      .status(200)
      .send({ user: details });
  } catch (err) {
    res.status(500).send(err);
  }
}

//// signout 
export function signout(req, res) {
  try {
    res.status(200).clearCookie("token").send("signing out is successfull!");
  } catch (err) {
    res.status(500).send(err);
  }
}

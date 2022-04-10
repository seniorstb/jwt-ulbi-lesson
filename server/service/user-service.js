const UserModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const uuid = require("uuid");
const mailServise = require("./mail-service");
const tokenService = require("./token-service");
const UserDto = require("../dtos/user-dto");

class UserService {
  async registration(email, password) {
    const candidate = await UserModel.findOne({ email });
    if (candidate) {
      throw new Error(
        `Пользователь с почтовым адресом ${email} уже существует`
      );
    }
    const hashPassword = await bcrypt.hash(password, 3);
    const activationLink = uuid.v4();

    const user = await UserModel.create({
      email,
      hashPassword,
      activationLink,
    });
    await mailServise.sendActivationMail(email, activationLink);

    const userDto = new UserDto(user);
    const tokens = tokenService.generateTokens({ ...userDto });
    await tokenService.saveToken(userDto.ud, tokens.refreshToken);

    return {
      ...tokens,
      user: userDto,
    };
  }
}

module.exports = new UserService();

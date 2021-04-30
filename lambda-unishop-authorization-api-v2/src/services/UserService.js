const DbCalls = require('../utils/DbCalls');

const getById = async (id) => {
  const dbCalls = new DbCalls();
  try {
    await dbCalls.connect();

    const sql = `SELECT socialType, user, accessToken, refreshToken, userId, socialId FROM social WHERE userId=?;`;
    const values = [id];
    const dt = await dbCalls.excuteQuery({ sql, values });
    const [firstRow] = dt || [];

    if (firstRow) return firstRow;

    return undefined;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (dbCalls) await dbCalls.disconnect();
  }
};

const getBySocialId = async (id) => {
  const dbCalls = new DbCalls();
  try {
    await dbCalls.connect();

    const sql = `SELECT socialType, user, accessToken, refreshToken, userId, socialId FROM social WHERE socialId=?;`;
    const values = [id];
    const dt = await dbCalls.excuteQuery({ sql, values });
    const [firstRow] = dt || [];

    if (firstRow) return firstRow;

    return undefined;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (dbCalls) await dbCalls.disconnect();
  }
};

const createSocial = async (data) => {
  const dbCalls = new DbCalls();
  try {
    await dbCalls.connect();
    const socialType = 'KAKAO';

    const sql = `INSERT INTO social (socialType, user, accessToken, refreshToken, userId, socialId)
    VALUES(?, ?, ?, ?, ?, ?);`;
    const values = [
      socialType,
      data.user,
      data.accessToken,
      data.refreshToken,
      data.userId,
      data.socialId,
    ];
    return await dbCalls.excuteQuery({ sql, values });
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (dbCalls) await dbCalls.disconnect();
  }
};

const updateUserSocial = async (data) => {
  const dbCalls = new DbCalls();
  try {
    await dbCalls.connect();
    const socialType = 'KAKAO';

    const sql = `UPDATE social SET user=? WHERE userId=?`;
    const values = [data.user, data.userId];
    return await dbCalls.excuteQuery({ sql, values });
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (dbCalls) await dbCalls.disconnect();
  }
};

const deleteSocial = async (id) => {
  const dbCalls = new DbCalls();
  try {
    await dbCalls.connect();

    const sql = `DELETE FROM social WHERE userId=? and socialType="KAKAO";`;
    const values = [id];

    return await dbCalls.excuteQuery({ sql, values });
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    if (dbCalls) await dbCalls.disconnect();
  }
};

module.exports = {
  getById,
  createSocial,
  deleteSocial,
  getBySocialId,
  updateUserSocial,
};

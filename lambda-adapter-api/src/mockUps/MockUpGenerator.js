const dashboard1 = require("./dashboard1");
const dashboard2 = require("./dashboard2");
const dashboard3 = require("./dashboard3");
const dashboard4 = require("./dashboard4");
const listOfDashboard = [dashboard1, dashboard2, dashboard3, dashboard4];

const genealogy1 = require("./genealogy1");
const genealogy2 = require("./genealogy2");
const genealogy3 = require("./genealogy3");
const genealogy4 = require("./genealogy4");
const listOfGenealogy = [genealogy1, genealogy2, genealogy3, genealogy4];


const nameList = require("./nameList");



const getRandomName = () => {
  const selectIndex = Math.round(Math.random() * (nameList.length - 1));
  const selectedData = nameList[selectIndex];
  return selectedData;
};

const replaceProfilePicture = (data) => {
  data.boxProfile.items[0].profilePicture = {
    sizes: [
      {
        size: "original",
        media: "https://picsum.photos/600/800",
      },
      {
        size: "500x500",
        media: "https://picsum.photos/500",
      },
    ],
    href:
      "https://hydra.unicity.net/v5a/customers/d9c0cf2092adbae3d31c982c2ed535f5/profilePicture",
  };
  return data;
};

const totalMonthToPeriod = totalMonth => `${(totalMonth / 12).toFixed(0)}-${`00${totalMonth % 12}`.slice(-2)}`

const getAdjPeriod = (periodString) => {
    const [yearInput, monthInput] = periodString.split("-"); 
    const totalMonthInput  = (parseInt(yearInput) * 12) + parseInt(parseInt(monthInput))

    const totalMonthQuery = 24244
    const now = new Date()
    const totalMonthNow = (now.getFullYear() * 12) + parseInt(now.getMonth() + 1)
    const adjMonth = totalMonthNow - totalMonthQuery

    return totalMonthToPeriod(totalMonthInput + adjMonth)
};

const scanReplace = async (data) => {
  const scan = async (obj) => {
    for (let key of Object.keys(obj)) {
      if (obj[key] != null && typeof obj[key] === "object") {
        if (key === "customer") {
          const [
            baId,
            fName,
            lName,
            fNativeName,
            lNativeName,
          ] = getRandomName();

          if (obj[key].unicity) obj[key].unicity = baId;
          if (obj[key].id && obj[key].id.unicity) obj[key].id.unicity = baId;

          if (obj[key].humanName) {
            // English Name
            if (obj[key].humanName.fullName)
              obj[key].humanName.fullName = `${fName} ${lName}`;
            if (obj[key].humanName.firstName)
              obj[key].humanName.firstName = fName;
            if (obj[key].humanName.lastName)
              obj[key].humanName.lastName = lName;

              // English Name
            if (obj[key].humanName["fullName@th"])
              obj[key].humanName[
                "fullName@th"
              ] = `${fNativeName} ${lNativeName}`;
            if (obj[key].humanName["firstName@th"])
              obj[key].humanName["firstName@th"] = fNativeName;
            if (obj[key].humanName["lastName@th"])
              obj[key].humanName["lastName@th"] = lNativeName;

              // English Name
            if (obj[key].humanName["fullName@en"])
              obj[key].humanName[
                "fullName@en"
              ] = `${fNativeName} ${lNativeName}`;
            if (obj[key].humanName["firstName@en"])
              obj[key].humanName["firstName@en"] = fNativeName;
            if (obj[key].humanName["lastName@en"])
              obj[key].humanName["lastName@en"] = lNativeName;
          }
        } else {
          scan(obj[key]);
        }
      } else {
        if (key === "period") {
            obj[key] = getAdjPeriod(obj[key])
        }
      }
    }
  };

  await scan(data);

  return data;
};

module.exports.getRandomDashboard = async () => {
  const selectIndex = Math.round(Math.random() * (listOfDashboard.length - 1));
  let selectedData = listOfDashboard[selectIndex];

  selectedData = replaceProfilePicture(selectedData);
  selectedData = await scanReplace(selectedData);

  return selectedData;
};

module.exports.getRandomGenealogy = async () =>{
  const selectIndex = Math.round(Math.random() * (listOfGenealogy.length - 1));
  let selectedData = listOfGenealogy[selectIndex];

  selectedData = await scanReplace(selectedData);

  return selectedData;
}
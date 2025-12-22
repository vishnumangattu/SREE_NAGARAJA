const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vazhipad = require('./models/Vazhipad');

dotenv.config();

const vazhipaduList = [
    { en: "sarppabali", ml: "സർപ്പബലി (ഗ്രൂപ്പ്).", rate: 5000 },
    { en: "ashtanagapuja", ml: "അഷ്ടനാഗപൂജ (ഗ്രൂപ്പ്)", rate: 1000 },
    { en: "mruthyunjayahoma", ml: "മൃത്യുഞ്ജയ ഹോമം", rate: 10000 },
    { en: "rudrabhishekam", ml: "രുദ്രാഭിഷേകം", rate: 1500 },
    { en: "chuttuvilakku", ml: "ചുട്ടുവിളക്ക്", rate: 2000 },
    { en: "palpayasam", ml: "പാൽപായസം", rate: 400 },
    { en: "mruthyunjayahomam_small", ml: "മൃത്യുഞ്ജയഹോമം", rate: 400 },
    { en: "ashtadravyaganapathi", ml: "അഷ്ടദ്രവ്യഗണപതിഹോമം", rate: 500 },
    { en: "ganapathihomam", ml: "ഗണപതിഹോമം", rate: 80 },
    { en: "uthralikuttu", ml: "ഉത്രാളിക്കുട്ട്", rate: 250 },
    { en: "uthralinivedyam", ml: "ഉത്രാളിനിവേദ്യം", rate: 250 },
    { en: "neerumpaalum", ml: "നീറുംപാലും", rate: 200 },
    { en: "karikkabhishekam", ml: "കരിക്കഭിഷേകം", rate: 60 },
    { en: "karikku_abishekam", ml: "കരിക്ക് അഭിഷേകം", rate: 30 },
    { en: "palabhishekam", ml: "പാൽഅഭിഷേകം", rate: 30 },
    { en: "udayam", ml: "ഉദയം", rate: 30 },
    { en: "kootabhojanam", ml: "കൂട്ടഭോജനം", rate: 50 },
    { en: "choroonu", ml: "ചോറൂണ്", rate: 100 },
    { en: "thulabharam", ml: "തുലാഭാരം", rate: 100 },
    { en: "shivapuja", ml: "ശിവപൂജ", rate: 50 },
    { en: "rahurdoshashanthi", ml: "രാഹുദോഷശാന്തി", rate: 50 },
    { en: "pushpanjali", ml: "പുഷ്പാഞ്ജലി", rate: 50 },
    { en: "bhagyasooktam", ml: "ഭാഗ്യസൂക്തം", rate: 50 },
    { en: "sarppasooktam", ml: "സർപ്പസൂക്തം", rate: 50 },
    { en: "puthrasooktam", ml: "പുത്രസൂക്തം", rate: 50 },
    { en: "swayamvarasooktam", ml: "സ്വയംവരസൂക്തം", rate: 50 },
    { en: "mruthyunjayasooktam", ml: "മൃത്യുഞ്ജയസൂക്തം", rate: 50 },
    { en: "vidhyasooktam", ml: "വിദ്യാസൂക്തം", rate: 50 },
    { en: "santhanagopalam", ml: "സന്താനഗോപാലം", rate: 50 },
    { en: "aikyamruthyunjayam", ml: "ഐക്യ മൃത്യുഞ്ജയം", rate: 50 },
    { en: "kalabhishekam", ml: "കലാഭിഷേകം", rate: 30 },
    { en: "kadali_vazhappazham", ml: "കടലി പഴവഴപ്പഴം", rate: 20 },
    { en: "thamarayum", ml: "താമരയും", rate: 20 },
    { en: "archana", ml: "അർച്ചന", rate: 15 },
    { en: "nilavilakku", ml: "നിലവിളക്കുസം", rate: 70 },
    { en: "alppam", ml: "അൽപ്പം", rate: 40 },
    { en: "aaditya_homa", ml: "ആദിത്യ ഹോമം", rate: 50 },
];

const seedVazhipads = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seed Vazhipads...');

        let addedCount = 0;
        let skippedCount = 0;

        for (const v of vazhipaduList) {
            // Mapping: constants.en -> code, constants.ml -> name
            const exists = await Vazhipad.findOne({ code: v.en });
            if (!exists) {
                // Check if name is taken but code is different (unlikely but possible)
                const nameExists = await Vazhipad.findOne({ name: v.ml });
                if (nameExists) {
                    console.log(`Skipping ${v.en}: Name '${v.ml}' already taken by code ${nameExists.code}`);
                    skippedCount++;
                    continue;
                }

                await Vazhipad.create({
                    code: v.en,
                    name: v.ml,
                    rate: v.rate,
                    status: 'active'
                });
                console.log(`Added: ${v.ml} (${v.en})`);
                addedCount++;
            } else {
                console.log(`Skipped: ${v.en} (Already exists)`);
                skippedCount++;
            }
        }

        console.log(`\nMigration Completed!`);
        console.log(`Added: ${addedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedVazhipads();

const { getTime, drive } = global.utils;
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "NTKhang",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "Cảm ơn bạn đã mời tôi vào nhóm!\nPrefix bot: %1\nĐể xem danh sách lệnh hãy nhập: %1help",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "Xin chào {userName}.\nChào mừng bạn đến với {boxName}.\nChúc bạn có buổi {session} vui vẻ!"
		},
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			welcomeMessage: "𝐬𝐚𝐥𝐮𝐭, 𝐦𝐨𝐢 𝐜'𝐞𝐬𝐭 ✰..🅗🅐🅜🅔🅓.✰☄ 𝐣𝐞 𝐯𝐨𝐮𝐬 𝐫𝐞𝐦𝐞𝐫𝐜𝐢𝐞 𝐩𝐨𝐮𝐫 𝐯𝐨𝐭𝐫𝐞 𝐢𝐧𝐯𝐢𝐭𝐚𝐭𝐢𝐨𝐧 \n𝗣𝗥𝗘𝗙𝗜𝗫 ☞ %1\n𝐩𝐨𝐮𝐫 𝐩𝐥𝐮𝐬 𝐝'𝐢𝐧𝐟𝐨𝐬 𝐬𝐮𝐫 𝐦𝐞𝐬 𝐜𝐦𝐝 𝐞́𝐜𝐫𝐢𝐭 𝐣𝐮𝐬𝐭𝐞 ☞ %1help",
			multiple1: "",
			multiple2: "",
			defaultWelcomeMessage: `𝐬𝐚𝐥𝐮𝐭  {userName}.\n𝐦𝐨𝐢 𝐜'𝐞𝐬𝐭 ✰..🅗🅐🅜🅔🅓.✰☄ 𝐣𝐞 𝐯𝐨𝐮𝐬 𝐬𝐨𝐮𝐡𝐚𝐢𝐭𝐞 𝐥𝐚 𝐛𝐢𝐞𝐧𝐯𝐞𝐧𝐮𝐞 𝐝𝐚𝐧𝐬 𝐥𝐞 𝐠𝐫𝐨𝐮𝐩𝐞 ☞{boxName}\n𝐣'𝐞𝐬𝐩𝐞̀𝐫𝐞 𝐪𝐮𝐞 𝐭𝐮 𝐯𝐚𝐬 𝐩𝐚𝐬𝐬𝐞𝐫 𝐮𝐧𝐞 𝐛𝐞𝐥𝐥𝐞 𝐬𝐨𝐢𝐫𝐞́𝐞 😌👈🏼`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;
				// if new member is bot
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());
					return message.send(getLang("welcomeMessage", prefix));
				}
				// if new member:
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				// push new member to array
				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				// if timeout is set, clear it
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				// set new timeout
				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;
					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}
					// {userName}:   name of new member
					// {multiple}:
					// {boxName}:    name of group
					// {threadName}: name of group
					// {session}:    session of day
					if (userName.length == 0) return;
					let { welcomeMessage = getLang("defaultWelcomeMessage") } =
						threadData.data;
					const form = {
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};
					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(
							/\{multiple\}/g,
							multiple ? getLang("multiple2") : getLang("multiple1")
						)
						.replace(
							/\{session\}/g,
							hours <= 10
								? getLang("session1")
								: hours <= 12
									? getLang("session2")
									: hours <= 18
										? getLang("session3")
										: getLang("session4")
						);

					form.body = welcomeMessage;

					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.reduce((acc, file) => {
							acc.push(drive.getFile(file, "stream"));
							return acc;
						}, []);
						form.attachment = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
					}
					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};

				

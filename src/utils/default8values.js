// Default classic 8values test preset configuration using vector SVG images
export const DEFAULT_8VALUES_TEST = {
  "id": "8values-classic",
  "title": "∞Values",
  "description": "∞Values is a political test that attempts to assign percentages for eight different political values across 4 main axes.",
  "version": "1.0.0",
  "theme": {
    "background": "#dddddd",
    "headings": "#222222",
    "text": "#444444",
    "lines": "#b0b0b0",
    "containerBg": "#eeeeee",
    "border": "#eeeeee",
    "resultsBarBg": "#eeeeee",
    "resultsBarBorder": "#222222",
    "htmlBg": "#bbbbbb",
    "centerBg": "#eeeeee"
  },
  "axes": [
    {
      "id": "econ",
      "name": "ECONOMIC",
      "left": {
        "name": "Equality",
        "color": "#f44336",
        "icon": "/raw_icons/equality.svg"
      },
      "right": {
        "name": "Markets",
        "color": "#00897b",
        "icon": "/raw_icons/markets.svg"
      },
      "tiers": [
        {
          "threshold": 90,
          "name": "Communist"
        },
        {
          "threshold": 75,
          "name": "Socialist"
        },
        {
          "threshold": 60,
          "name": "Social"
        },
        {
          "threshold": 40,
          "name": "Centrist"
        },
        {
          "threshold": 25,
          "name": "Market"
        },
        {
          "threshold": 10,
          "name": "Capitalist"
        },
        {
          "threshold": 0,
          "name": "Laissez-Faire"
        }
      ]
    },
    {
      "id": "dipl",
      "name": "DIPLOMATIC",
      "left": {
        "name": "Nation",
        "color": "#ff9800",
        "icon": "/raw_icons/nation.svg"
      },
      "right": {
        "name": "Globe",
        "color": "#03a9f4",
        "icon": "/raw_icons/globe.svg"
      },
      "tiers": [
        {
          "threshold": 90,
          "name": "Chauvinist"
        },
        {
          "threshold": 75,
          "name": "Nationalist"
        },
        {
          "threshold": 60,
          "name": "Patriotic"
        },
        {
          "threshold": 40,
          "name": "Balanced"
        },
        {
          "threshold": 25,
          "name": "Peaceful"
        },
        {
          "threshold": 10,
          "name": "Internationalist"
        },
        {
          "threshold": 0,
          "name": "Cosmopolitan"
        }
      ]
    },
    {
      "id": "govt",
      "name": "CIVIL",
      "left": {
        "name": "Liberty",
        "color": "#ffeb3b",
        "icon": "/raw_icons/liberty.svg"
      },
      "right": {
        "name": "Authority",
        "color": "#3f51b5",
        "icon": "/raw_icons/authority.svg"
      },
      "tiers": [
        {
          "threshold": 90,
          "name": "Anarchist"
        },
        {
          "threshold": 75,
          "name": "Libertarian"
        },
        {
          "threshold": 60,
          "name": "Liberal"
        },
        {
          "threshold": 40,
          "name": "Moderate"
        },
        {
          "threshold": 25,
          "name": "Statist"
        },
        {
          "threshold": 10,
          "name": "Authoritarian"
        },
        {
          "threshold": 0,
          "name": "Totalitarian"
        }
      ]
    },
    {
      "id": "scty",
      "name": "SOCIETAL",
      "left": {
        "name": "Tradition",
        "color": "#8e24aa",
        "icon": "/raw_icons/tradition.svg"
      },
      "right": {
        "name": "Progress",
        "color": "#e91e63",
        "icon": "/raw_icons/progress.svg"
      },
      "tiers": [
        {
          "threshold": 90,
          "name": "Reactionary"
        },
        {
          "threshold": 75,
          "name": "Very Traditional"
        },
        {
          "threshold": 60,
          "name": "Traditional"
        },
        {
          "threshold": 40,
          "name": "Neutral"
        },
        {
          "threshold": 25,
          "name": "Progressive"
        },
        {
          "threshold": 10,
          "name": "Very Progressive"
        },
        {
          "threshold": 0,
          "name": "Revolutionary"
        }
      ]
    }
  ],
  "questions": [
    {
      "id": 1,
      "text": "Oppression by corporations is more of a concern than oppression by governments.",
      "effects": {
        "econ": 10,
        "govt": -5
      }
    },
    {
      "id": 2,
      "text": "It is necessary for the government to intervene in the economy to protect consumers.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 3,
      "text": "The freer the markets, the freer the people.",
      "effects": {
        "econ": -10
      }
    },
    {
      "id": 4,
      "text": "It is better to maintain a balanced budget than to ensure welfare for all citizens.",
      "effects": {
        "econ": -10
      }
    },
    {
      "id": 5,
      "text": "Publicly-funded research is more beneficial to the people than leaving it to the market.",
      "effects": {
        "econ": 10,
        "scty": -10
      }
    },
    {
      "id": 6,
      "text": "Tariffs on international trade are important to encourage local production.",
      "effects": {
        "econ": 5,
        "govt": -10
      }
    },
    {
      "id": 7,
      "text": "From each according to his ability, to each according to his needs.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 8,
      "text": "It would be best if social programs were abolished in favor of private charity.",
      "effects": {
        "econ": -10
      }
    },
    {
      "id": 9,
      "text": "Taxes should be increased on the rich to provide for the poor.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 10,
      "text": "Inheritance is a legitimate form of wealth.",
      "effects": {
        "econ": -10,
        "scty": 5
      }
    },
    {
      "id": 11,
      "text": "Basic utilities like roads and electricity should be publicly owned.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 12,
      "text": "Government intervention is a threat to the economy.",
      "effects": {
        "econ": -10
      }
    },
    {
      "id": 13,
      "text": "Those with a greater ability to pay should receive better healthcare.",
      "effects": {
        "econ": -10
      }
    },
    {
      "id": 14,
      "text": "Quality education is a right of all people.",
      "effects": {
        "econ": 10,
        "scty": -5
      }
    },
    {
      "id": 15,
      "text": "The means of production should belong to the workers who use them.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 16,
      "text": "The United Nations should be abolished.",
      "effects": {
        "dipl": 10,
        "govt": -5
      }
    },
    {
      "id": 17,
      "text": "Military action by our nation is often necessary to protect it.",
      "effects": {
        "dipl": 10,
        "govt": -10
      }
    },
    {
      "id": 18,
      "text": "I support regional unions, such as the European Union.",
      "effects": {
        "econ": -5,
        "dipl": -10,
        "govt": 10,
        "scty": -5
      }
    },
    {
      "id": 19,
      "text": "It is important to maintain our national sovereignty.",
      "effects": {
        "dipl": 10,
        "govt": -5
      }
    },
    {
      "id": 20,
      "text": "A united world government would be beneficial to mankind.",
      "effects": {
        "dipl": -10
      }
    },
    {
      "id": 21,
      "text": "It is more important to retain peaceful relations than to further our strength.",
      "effects": {
        "dipl": -10
      }
    },
    {
      "id": 22,
      "text": "Wars do not need to be justified to other countries.",
      "effects": {
        "dipl": 10,
        "govt": -10
      }
    },
    {
      "id": 23,
      "text": "Military spending is a waste of money.",
      "effects": {
        "dipl": -10,
        "govt": 10
      }
    },
    {
      "id": 24,
      "text": "International aid is a waste of money.",
      "effects": {
        "econ": -5,
        "dipl": 10
      }
    },
    {
      "id": 25,
      "text": "My nation is great.",
      "effects": {
        "dipl": 10
      }
    },
    {
      "id": 26,
      "text": "Research should be conducted on an international scale.",
      "effects": {
        "dipl": -10,
        "scty": -10
      }
    },
    {
      "id": 27,
      "text": "Governments should be accountable to the international community.",
      "effects": {
        "dipl": -10,
        "govt": 5
      }
    },
    {
      "id": 28,
      "text": "Even when protesting an authoritarian government, violence is not acceptable.",
      "effects": {
        "dipl": -5,
        "govt": -5
      }
    },
    {
      "id": 29,
      "text": "My religious values should be spread as much as possible.",
      "effects": {
        "dipl": 5,
        "govt": -10,
        "scty": 10
      }
    },
    {
      "id": 30,
      "text": "Our nation's values should be spread as much as possible.",
      "effects": {
        "dipl": 10,
        "govt": -5
      }
    },
    {
      "id": 31,
      "text": "It is very important to maintain law and order.",
      "effects": {
        "dipl": 5,
        "govt": -10,
        "scty": 5
      }
    },
    {
      "id": 32,
      "text": "The general populace makes poor decisions.",
      "effects": {
        "govt": -10
      }
    },
    {
      "id": 33,
      "text": "Physician-assisted suicide should be legal.",
      "effects": {
        "govt": 10
      }
    },
    {
      "id": 34,
      "text": "The sacrifice of some civil liberties is necessary to protect us from acts of terrorism.",
      "effects": {
        "govt": -10
      }
    },
    {
      "id": 35,
      "text": "Government surveillance is necessary in the modern world.",
      "effects": {
        "govt": -10
      }
    },
    {
      "id": 36,
      "text": "The very existence of the state is a threat to our liberty.",
      "effects": {
        "govt": 10
      }
    },
    {
      "id": 37,
      "text": "Regardless of political opinions, it is important to side with your country.",
      "effects": {
        "dipl": 10,
        "govt": -10,
        "scty": 5
      }
    },
    {
      "id": 38,
      "text": "All authority should be questioned.",
      "effects": {
        "govt": 10,
        "scty": -5
      }
    },
    {
      "id": 39,
      "text": "A hierarchical state is best.",
      "effects": {
        "govt": -10
      }
    },
    {
      "id": 40,
      "text": "It is important that the government follows the majority opinion, even if it is wrong.",
      "effects": {
        "govt": 10
      }
    },
    {
      "id": 41,
      "text": "The stronger the leadership, the better.",
      "effects": {
        "dipl": 10,
        "govt": -10
      }
    },
    {
      "id": 42,
      "text": "Democracy is more than a decision-making process.",
      "effects": {
        "govt": 10
      }
    },
    {
      "id": 43,
      "text": "Environmental regulations are essential.",
      "effects": {
        "econ": 5,
        "scty": -10
      }
    },
    {
      "id": 44,
      "text": "A better world will come from automation, science, and technology.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 45,
      "text": "Children should be educated in religious or traditional values.",
      "effects": {
        "govt": -5,
        "scty": 10
      }
    },
    {
      "id": 46,
      "text": "Traditions are of no value on their own.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 47,
      "text": "Religion should play a role in government.",
      "effects": {
        "govt": -10,
        "scty": 10
      }
    },
    {
      "id": 48,
      "text": "Churches should be taxed the same way other institutions are taxed.",
      "effects": {
        "econ": 5,
        "scty": -10
      }
    },
    {
      "id": 49,
      "text": "Climate change is currently one of the greatest threats to our way of life.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 50,
      "text": "It is important that we work as a united world to combat climate change.",
      "effects": {
        "dipl": -10,
        "scty": -10
      }
    },
    {
      "id": 51,
      "text": "Society was better many years ago than it is now.",
      "effects": {
        "scty": 10
      }
    },
    {
      "id": 52,
      "text": "It is important that we maintain the traditions of our past.",
      "effects": {
        "scty": 10
      }
    },
    {
      "id": 53,
      "text": "It is important that we think in the long term, beyond our lifespans.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 54,
      "text": "Reason is more important than maintaining our culture.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 55,
      "text": "Drug use should be legalized or decriminalized.",
      "effects": {
        "govt": 10,
        "scty": -2
      }
    },
    {
      "id": 56,
      "text": "Same-sex marriage should be legal.",
      "effects": {
        "govt": 10,
        "scty": -10
      }
    },
    {
      "id": 57,
      "text": "No cultures are superior to others.",
      "effects": {
        "dipl": -10,
        "govt": 5,
        "scty": -10
      }
    },
    {
      "id": 58,
      "text": "Sex outside marriage is immoral.",
      "effects": {
        "govt": -5,
        "scty": 10
      }
    },
    {
      "id": 59,
      "text": "If we accept migrants at all, it is important that they assimilate into our culture.",
      "effects": {
        "govt": -5,
        "scty": 10
      }
    },
    {
      "id": 60,
      "text": "Abortion should be prohibited in most or all cases.",
      "effects": {
        "govt": -10,
        "scty": 10
      }
    },
    {
      "id": 61,
      "text": "Gun ownership should be prohibited for those without a valid reason.",
      "effects": {
        "govt": -10
      }
    },
    {
      "id": 62,
      "text": "I support single-payer, universal healthcare.",
      "effects": {
        "econ": 10
      }
    },
    {
      "id": 63,
      "text": "Prostitution should be illegal.",
      "effects": {
        "govt": -10,
        "scty": 10
      }
    },
    {
      "id": 64,
      "text": "Maintaining family values is essential.",
      "effects": {
        "scty": 10
      }
    },
    {
      "id": 65,
      "text": "To chase progress at all costs is dangerous.",
      "effects": {
        "scty": 10
      }
    },
    {
      "id": 66,
      "text": "Genetic modification is a force for good, even on humans.",
      "effects": {
        "scty": -10
      }
    },
    {
      "id": 67,
      "text": "We should open our borders to immigration.",
      "effects": {
        "dipl": -10,
        "govt": 10
      }
    },
    {
      "id": 68,
      "text": "Governments should be as concerned about foreigners as they are about their own citizens.",
      "effects": {
        "dipl": -10
      }
    },
    {
      "id": 69,
      "text": "All people - regardless of factors like culture or sexuality - should be treated equally.",
      "effects": {
        "econ": 10,
        "dipl": -10,
        "govt": 10,
        "scty": -10
      }
    },
    {
      "id": 70,
      "text": "It is important that we further my group's goals above all others.",
      "effects": {
        "econ": -10,
        "dipl": 10,
        "govt": -10,
        "scty": 10
      }
    }
  ],
  "ideologies": [
    {
      "name": "Anarcho-Communism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 50,
        "govt": 100,
        "scty": 90
      }
    },
    {
      "name": "Libertarian Communism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 70,
        "govt": 80,
        "scty": 80
      }
    },
    {
      "name": "Trotskyism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 100,
        "govt": 60,
        "scty": 80
      }
    },
    {
      "name": "Marxism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 70,
        "govt": 40,
        "scty": 80
      }
    },
    {
      "name": "De Leonism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 30,
        "govt": 30,
        "scty": 80
      }
    },
    {
      "name": "Leninism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 40,
        "govt": 20,
        "scty": 70
      }
    },
    {
      "name": "Stalinism/Maoism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 20,
        "govt": 0,
        "scty": 60
      }
    },
    {
      "name": "Religious Communism",
      "description": "",
      "stats": {
        "econ": 100,
        "dipl": 50,
        "govt": 30,
        "scty": 30
      }
    },
    {
      "name": "State Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 30,
        "govt": 30,
        "scty": 70
      }
    },
    {
      "name": "Theocratic Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 50,
        "govt": 30,
        "scty": 20
      }
    },
    {
      "name": "Religious Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 50,
        "govt": 70,
        "scty": 20
      }
    },
    {
      "name": "Democratic Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 50,
        "govt": 50,
        "scty": 80
      }
    },
    {
      "name": "Revolutionary Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 20,
        "govt": 50,
        "scty": 70
      }
    },
    {
      "name": "Libertarian Socialism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 80,
        "govt": 80,
        "scty": 80
      }
    },
    {
      "name": "Anarcho-Syndicalism",
      "description": "",
      "stats": {
        "econ": 80,
        "dipl": 50,
        "govt": 100,
        "scty": 80
      }
    },
    {
      "name": "Left-Wing Populism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 40,
        "govt": 30,
        "scty": 70
      }
    },
    {
      "name": "Theocratic Distributism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 40,
        "govt": 30,
        "scty": 20
      }
    },
    {
      "name": "Distributism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 50,
        "govt": 50,
        "scty": 20
      }
    },
    {
      "name": "Social Liberalism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 60,
        "govt": 60,
        "scty": 80
      }
    },
    {
      "name": "Christian Democracy",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 60,
        "govt": 50,
        "scty": 30
      }
    },
    {
      "name": "Social Democracy",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 70,
        "govt": 60,
        "scty": 80
      }
    },
    {
      "name": "Progressivism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 80,
        "govt": 60,
        "scty": 100
      }
    },
    {
      "name": "Anarcho-Mutualism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 50,
        "govt": 100,
        "scty": 70
      }
    },
    {
      "name": "National Totalitarianism",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 20,
        "govt": 0,
        "scty": 50
      }
    },
    {
      "name": "Global Totalitarianism",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 80,
        "govt": 0,
        "scty": 50
      }
    },
    {
      "name": "Technocracy",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 60,
        "govt": 20,
        "scty": 70
      }
    },
    {
      "name": "Centrist",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 50,
        "govt": 50,
        "scty": 50
      }
    },
    {
      "name": "Liberalism",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 60,
        "govt": 60,
        "scty": 60
      }
    },
    {
      "name": "Religious Anarchism",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 50,
        "govt": 100,
        "scty": 20
      }
    },
    {
      "name": "Right-Wing Populism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 30,
        "govt": 30,
        "scty": 30
      }
    },
    {
      "name": "Moderate Conservatism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 40,
        "govt": 50,
        "scty": 30
      }
    },
    {
      "name": "Reactionary",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 40,
        "govt": 40,
        "scty": 10
      }
    },
    {
      "name": "Social Libertarianism",
      "description": "",
      "stats": {
        "econ": 60,
        "dipl": 70,
        "govt": 80,
        "scty": 70
      }
    },
    {
      "name": "Libertarianism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 60,
        "govt": 80,
        "scty": 60
      }
    },
    {
      "name": "Anarcho-Egoism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 50,
        "govt": 100,
        "scty": 50
      }
    },
    {
      "name": "Nazism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 0,
        "govt": 0,
        "scty": 5
      }
    },
    {
      "name": "Autocracy",
      "description": "",
      "stats": {
        "econ": 50,
        "dipl": 20,
        "govt": 20,
        "scty": 50
      }
    },
    {
      "name": "Fascism",
      "description": "",
      "stats": {
        "econ": 40,
        "dipl": 20,
        "govt": 20,
        "scty": 20
      }
    },
    {
      "name": "Capitalist Fascism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 20,
        "govt": 20,
        "scty": 20
      }
    },
    {
      "name": "Conservatism",
      "description": "",
      "stats": {
        "econ": 30,
        "dipl": 40,
        "govt": 40,
        "scty": 20
      }
    },
    {
      "name": "Neo-Liberalism",
      "description": "",
      "stats": {
        "econ": 30,
        "dipl": 30,
        "govt": 50,
        "scty": 60
      }
    },
    {
      "name": "Classical Liberalism",
      "description": "",
      "stats": {
        "econ": 30,
        "dipl": 60,
        "govt": 60,
        "scty": 80
      }
    },
    {
      "name": "Authoritarian Capitalism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 30,
        "govt": 20,
        "scty": 40
      }
    },
    {
      "name": "State Capitalism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 50,
        "govt": 30,
        "scty": 50
      }
    },
    {
      "name": "Neo-Conservatism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 20,
        "govt": 40,
        "scty": 20
      }
    },
    {
      "name": "Fundamentalism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 30,
        "govt": 30,
        "scty": 5
      }
    },
    {
      "name": "Libertarian Capitalism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 50,
        "govt": 80,
        "scty": 60
      }
    },
    {
      "name": "Market Anarchism",
      "description": "",
      "stats": {
        "econ": 20,
        "dipl": 50,
        "govt": 100,
        "scty": 50
      }
    },
    {
      "name": "Objectivism",
      "description": "",
      "stats": {
        "econ": 10,
        "dipl": 50,
        "govt": 90,
        "scty": 40
      }
    },
    {
      "name": "Totalitarian Capitalism",
      "description": "",
      "stats": {
        "econ": 0,
        "dipl": 30,
        "govt": 0,
        "scty": 50
      }
    },
    {
      "name": "Ultra-Capitalism",
      "description": "",
      "stats": {
        "econ": 0,
        "dipl": 40,
        "govt": 50,
        "scty": 50
      }
    },
    {
      "name": "Anarcho-Capitalism",
      "description": "",
      "stats": {
        "econ": 0,
        "dipl": 50,
        "govt": 100,
        "scty": 50
      }
    }
  ]
};

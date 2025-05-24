import { context, extension, input } from "@daydreamsai/core";
import { z } from "zod";
import { render } from "@daydreamsai/core";
import { StarknetChain } from "@daydreamsai/defai";


import { CONTEXT } from "./contexts/ponziland-context";

import { get_balances_str, get_lands_str } from "./utils/querys";
import { get_auctions, get_claims, get_neighbors, get_all_lands, get_owned_lands, get_context, get_auction_yield } from "./actions/ponziland/querys";
import { get_balances } from "./actions/get-balances";
import { bid } from "./actions/ponziland/bid";
import { buy } from "./actions/ponziland/buy";
import { increase_price, level_up, increase_stake } from "./actions/ponziland/misc";
import { claim_all } from "./actions/ponziland/claim";

const template = `

  {{guide}}

  -------------------------------
  Here is the current ponziland context:

  Your Lands: {{lands}}
  Goal: {{goal}}

  Token Balances: {{balance}}

  --------------------------------
  Make sure that you stop on a successful action, or if your attempt to act fails.
  Remember to only include a location if you are moving.

  You should send updates about everything you do in this discord channel: 1352657633374371861
  
  Only tweet if about your ponziland actions if you do something big like getting a new land or claiming a lot of tokens.
  Remember if you have no lands you will have no claims or neighbors. 

  Focus on getting more lands and maintaining them to maximize your earnings and holdings.

  Always wait until the result of your transaction is confirmed before posting about it, making sure not to make anything up.

  If a transaction fails, do not retry, just send an update with the error in discord. DO NOT tweet about failed transactions.

  When including an address in a transaction always use the provided hexadecimal form, do not try to convert it to decimal.

  DO NOT EVER tweet about failed transactions or unsuccessful ponziland actions. 
  DO NOT EVER TWEET ABOUT FAILED TRANSACTIONS OR HAVING GAS PROBLEMS.

  Only bid on auctions that are neighboring one of your btc lands. Also, if you see a neighboring land
  is listed for sale in a token you have enough of, you should buy it to expand your empire. You can
  check the neighbors of a land with the get_neighbors action, and use that to identify possible purchases.

  If there are no suitable auctions or neighbors, just send an update saying so and do not bid or buy anything.
  Remember you don't want to waste all your resources. 

  Be aggressive in targeting the neighbors of your lands. If you can afford to buy one you should.
  Only worry about conserving resources when you are almost out (< 100)
  You also should use the get_neighbors and get_all_lands actions to identify possible purchases.
  If there is an afforadable land that is not a neighbor, you should still buy it and stake it with btc.

  When you claim your yield, you should tweet about how much you just claimed, but only claim when
  its a significant amount.

  PONZILAND_ACTIONS ADDRESS: 0x19b9cef5b903e9838d649f40a8bfc34fbaf644c71f8b8768ece6a6ca1c46dc0

  {{context}}
`;

const ponzilandContext = context({
  type: "ponziland",
  schema: z.object({
    id: z.string(),
    lands: z.string(),
    goal: z.string(),
    balance: z.string(),
    context: z.string(),
  }),

  key({ id }) {
    return id;
  },

  create(state) {
    return {
      lands: state.args.lands,
      balance: state.args.balance,
      goal: state.args.goal,
    };
  },

  render({ memory }) {
    return render(template, {
      guide: CONTEXT,
      lands: memory.lands,
      balance: memory.balance,
      goal: memory.goal,
      context: CONTEXT,
    });
  },
});

export const ponziland_check = (chain: StarknetChain) => input({
  schema: z.object({
    text: z.string(),
  }),
  subscribe(send, { container }) {
    // Check mentions every minute
    let index = 0;
    let timeout: ReturnType<typeof setTimeout>;

    // Function to schedule the next thought with random timing
    const scheduleNextThought = async () => {
      // Random delay between 3 and 10 minutes (180000-600000 ms)
      const minDelay = 300000; // 3 minutes
      const maxDelay = 400000; // 10 minutes
      const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      
      console.log(`Scheduling next ponziland check in ${randomDelay/60000} minutes`);
      
      timeout = setTimeout(async () => {

        let text = `Decide what action to take in ponziland, if any`

        let goal = "Build your bitcoin empire in ponziland"

        let lands = await get_lands_str()
        let balance = await get_balances_str()

        let context_str = await CONTEXT()

        let context = {
          id: "ponziland",
          lands: lands,
          balance: balance,
          goal: goal,
          context: context_str,
        }

        console.log('ponziland context', context);

        send(ponzilandContext, context, { text });
        index += 1;
        
        // Schedule the next thought
        scheduleNextThought();
      }, randomDelay);
    };
    
    // Start the first thought cycle
    scheduleNextThought();

    return () => clearTimeout(timeout);
  },
});

export const ponziland = (chain: StarknetChain) => {

  return extension({
  name: "ponziland",
  contexts: {
    ponziland: ponzilandContext,
  },
  inputs: {
 //   "ponziland_check": ponziland_check(chain),
  },
  actions: [
    get_owned_lands(chain),
    get_auctions(chain),
    get_claims(chain),
    get_neighbors(chain),
    get_all_lands(chain),
    get_context(chain),
    get_balances(chain),
    bid(chain),
    buy(chain),
    level_up(chain),
    increase_stake(chain),
    increase_price(chain),
    get_auction_yield(chain),
    claim_all(chain),
  ],

  });
}
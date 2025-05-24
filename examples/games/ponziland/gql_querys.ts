export const balance_query = `query GetTokenBalances {
    tokenBalances(accountAddress:"0xd29355d204c081b3a12c552cae38e0ffffb3e28c9dd956bee6466f545cf38a"){
      edges{
        node{
          tokenMetadata{
             ... on ERC20__Token {
              symbol
              amount
              contractAddress
            }
          }
        }
      }
    }
  }`
  
export const auction_query = `query GetActiveAuctions {
    ponziLandAuctionModels(where:{is_finished: false}){
        edges{
        node{
            start_time
            is_finished
            start_price
            floor_price
            land_location
            decay_rate
        }
        }
    }
  }`
  
export const land_query = `query GetOwnedLands {
ponziLandLandModels(where:{owner:"0x00d29355d204c081b3a12c552cae38e0ffffb3e28c9dd956bee6466f545cf38a"}){
  edges{
    node{
      location
      sell_price
      token_used
    }
  }
  }

  }`

  export const nuke_query = `query GetNukeableLands {
    ponziLandLandModels(where:{stake_amount: "0"}){
      edges{
        node{
          location
        }
      }
    }
  }`

import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import NFTBox from "./NFTBox"
import Link from "next/link"
import formatPrice from "../utils/formatPrice"
interface NFTItem{
    rindexerId:string
    seller:string
    nftAddress:string
    price:string
    tokenId:string
    contractAddress:string
    txHash:string
    blockNumber:string
}
interface BoughtCanceled {
    nftAddress:string
    tokenId:string
}
interface NFTQueryRespone {
    data:{
        allItemListeds: {
            nodes: NFTItem[]
        },
        allItemBoughts: {
            nodes: BoughtCanceled[]
        },
        allItemCanceleds: {
            nodes: BoughtCanceled[]
        }
    }
} 



const GET_RECENT_NFTS = `
query allItemListeds {
  allItemListeds(first: 20, orderBy: [BLOCK_NUMBER_DESC, TX_INDEX_DESC]) {
    nodes {
      nftAddress
      price
      seller
      tokenId
      contractAddress
      txHash
      blockNumber
    }
  }

  allItemCanceleds {
  nodes{
    nftAddress
    tokenId
    }
}  

  allItemBoughts {
  nodes{
    tokenId
    nftAddress
    }
  }
}
`
async function fetchNFTs(): Promise<NFTQueryRespone>{
    const response = await fetch("http://localhost:3001/graphql",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: GET_RECENT_NFTS,
        }),
    })
    return response.json() 
}
function useRecentlyListedNFT(){
    const {data, isLoading, error} = useQuery({
        queryKey: ["recentNFTs"],
        queryFn: fetchNFTs,
    })

    const nftDataList = useMemo(()=>{
        if(!data) return []

        const boughtNFTs = new Set<string>()
        const canceledNFTs = new Set<string>()

        data.data.allItemBoughts.nodes.forEach((item) => {
            boughtNFTs.add(` ${item.nftAddress} -${item.tokenId}`)
        })

        data.data.allItemCanceleds.nodes.forEach((item) => {
            canceledNFTs.add(` ${item.nftAddress} -${item.tokenId}`)
        })

        const availNFTs = data.data.allItemListeds.nodes.filter(item =>{
            if(!item.nftAddress || !item.tokenId) return false
            const key = ` ${item.nftAddress} -${item.tokenId}`
            return !boughtNFTs.has(key) && !canceledNFTs.has(key)
        })
        const recentNFTs = availNFTs.slice(0,100)

        return recentNFTs.map(nft => ({
            tokenId : nft.tokenId,
            contractAddress: nft.contractAddress,
            price: nft.price,
        }))

    },[ data])
    return{ isLoading,error,nftDataList }
}
export default function RecentlyListedNFTs() {
    const { isLoading, error, nftDataList } = useRecentlyListedNFT()
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mt-8 text-center">
                <Link
                    href="/list-nft"
                    className="inline-block py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    List Your NFT
                </Link>
            </div>
            <h2 className="text-2xl font-bold mb-6">Recently Listed NFTs</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {nftDataList.map(nft =>(
                    <Link href={`/buy-nft/${nft.contractAddress}/${nft.tokenId}`}
                        key ={ `${nft.contractAddress}-${nft.tokenId}` }>
                    <NFTBox 
                        key ={ `${nft.contractAddress}-${nft.tokenId}` }
                        tokenId={nft.tokenId}
                        contractAddress={nft.contractAddress}
                        price={nft.price}
                    />
                    </Link>
                ))}
            </div>
        </div>
    )
}
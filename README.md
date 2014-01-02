XmasCoin (XMAS) - a 'faster' version of Litecoin which also uses scrypt
as a proof of work scheme and is intended for microtransactions.
 - 10 minutes block targets: beat that MinCoin! ;)
 - 95922000 total coins
 - no subsidy within the first 1 days and after approximately 4 years;
    in between: 4 coins per generated block
 - difficulty retargets every 12 hours
 - currently peers are looked up over IRC only
 - currently no block checkpoints are in the code (but could be easily
   added)
Other than that, this coin is exactly like Litecoin and should by no
means be used as a real cryptocurrency. All of the coin parameters
are chosen arbitrarily or at most with 'fairness' towards everyone in mind.

So actually, this 'new' coin exists for the following reasons:
 - XMAS proves that really anyone(!) can start a Litecoin/Bitcoin based currency
    (just look at the changes I applied to the original Litecoin source,
     for genesis block generation look at main.cpp)
 - allows me to experiment with coin parameters (in a private network)

Finally, I only tested the command line server/tool 'xmascoin' for the
first 365 blocks. Credits go to the original authors/communities that
created Bitcoin and Litecoin.

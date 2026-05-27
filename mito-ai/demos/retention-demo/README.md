The first question is the headline question the PM is trying to answer in the doc — not the reviewer's pushback.The first question is the headline question the PM is trying to answer in the doc — not the reviewer's pushback. Something like:

> What was our customer retention in Q1 2026?

That's what the doc is about. The PM writes it up, the code cell computes it, the prose reads "retention was {{q1_retention}}" → 78%.
Then the reviewer's question — the one that triggers the reactive update — is:

> What if we exclude trial users?

Toggle the filter, every reference in the doc updates, 78% → 94%.
So the demo flow is two questions, not one:

PM's question (sets up the doc): "What was Q1 retention?" → 78%
Reviewer's question (the reactive moment): "What if we exclude trials?" → 94%

The second question is what sells the product. The first question is what makes the second question matter.
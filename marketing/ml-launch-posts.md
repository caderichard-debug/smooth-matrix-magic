# ML tools launch: post drafts

Drafts for promoting the ML calculators (https://matrixdojo.app/ml-tools). Post them yourself,
spread over a few weeks, and rewrite in your own voice. Communities react badly to anything
that reads like marketing copy.

Before posting:

- Deploy the prerendering + ML hub changes and check that the links below load.
- Read each community's self-promotion rules. Several subreddits allow it only in weekly threads.
- Plan to be around for the first 2–3 hours after posting to answer comments. That is where most
  of the value (and the goodwill) comes from.

---

## Hacker News: Show HN

Show HN works best on weekday mornings, US Eastern time. Link straight to the tool, not the
hub, and put the explanation in a first comment.

**Title:** Show HN: Step through transformer attention by hand in the browser

**URL:** https://matrixdojo.app/ml-attention?q=1,0&k=1,0;0,1&v=1,2;3,4

**First comment:**

> I kept losing track of shapes and intermediate values when explaining attention, so I built a
> set of small calculators that show every step: QKᵀ, the √dₖ scaling, softmax weights, masking,
> and the weighted output. There is also a multi-head walkthrough (projection → split → per-head
> attention → concat → W_O), plus Adam, convolution vs cross-correlation, LayerNorm/RMSNorm, and a
> few others.
>
> Everything runs client-side, and every calculation can be shared as a link. The one above is the
> worked example from the page.
>
> I'd love feedback on which operations are missing, and on anything that is wrong or confusing.

---

## Reddit: r/learnmachinelearning

**Title:** I made free calculators that show the intermediate matrices in attention, Adam, and convolution

> When I was learning transformers, the hardest part was keeping track of what each matrix looks
> like at each step. I built some small browser tools that show every intermediate result,
> for example the scaled scores, softmax weights and output for attention:
> https://matrixdojo.app/ml-attention
>
> Others: multi-head attention shapes, a first Adam step with bias correction, true convolution vs
> the cross-correlation CNNs actually compute, and BatchNorm vs LayerNorm vs RMSNorm. Full list:
> https://matrixdojo.app/ml-tools
>
> Free, no signup, runs locally. Happy to add tools people would find useful.

---

## Reddit: r/MachineLearning

This subreddit is strict. Only post in the weekly "[D] Self-Promotion Thread", using a short
version of the r/learnmachinelearning post.

---

## dev.to / Hashnode / Medium article

A tutorial earns lasting search traffic and backlinks better than a launch post.

**Title:** Transformer attention by hand: every matrix, step by step

**Outline:**

1. Why attention is confusing: four matrices and three operations hidden in one line of code.
2. A tiny example you can follow by hand: Q = [[1, 0]], K = [[1, 0], [0, 1]],
   V = [[1, 2], [3, 4]].
3. Step 1: scores QKᵀ, and what a dot product says about query–key similarity.
4. Step 2: why divide by √dₖ (variance grows with dimension; softmax saturates).
5. Step 3: softmax over keys, so each query's weights sum to 1.
6. Step 4: the output as a weighted blend of value rows ([1.660, 2.660]).
7. Masking: adding −∞ for causal attention.
8. Going multi-head: split d across heads, attend, concatenate, project.
9. "Try it yourself" links to the prefilled calculators at each step.

Cross-post to your own blog first if you have one and set the canonical URL there.

---

## Course and resource pages (highest-value links)

A short, personal email to instructors or TAs of ML and linear algebra courses (check the
course's public website for a "resources" page):

> Hi [name],
>
> I've built a free set of browser calculators that show the intermediate matrices in attention,
> optimizers, and convolution: https://matrixdojo.app/ml-tools. Students can share any
> calculation as a link, which might be handy for office hours or problem sets.
>
> If you think it would help your students, I'd be grateful if you considered listing it on the
> course resources page. Any feedback is welcome too.
>
> Thanks,
> [your name]

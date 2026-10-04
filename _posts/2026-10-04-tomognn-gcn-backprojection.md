---
layout: post
title: "TomoGNN's graph layer is a normalized backprojection"
date: 2026-10-04 10:00:00+0200
description: Why the single GCN layer that maps a PET sinogram to an image in TomoGNN reduces to a degree-normalized backprojection.
related_posts: false
---

[TomoGNN](https://github.com/Mellak/TomoGNN) was an early project of mine on direct PET reconstruction.
It chains three blocks: a CNN that denoises the sinogram, a single graph convolutional (GCN) layer that maps the sinogram to the image, and a CNN that refines the image.
The graph is bipartite: one node per line of response (LOR), one node per pixel, and an edge between LOR $$i$$ and pixel $$j$$ whenever the system matrix entry $$a_{ij}$$ is non-zero, with $$a_{ij}$$ as the edge weight.
In the code, the edges come straight from the ASTRA strip projector matrix.

It is tempting to read the middle block as a learned sinogram-to-image operator. It isn't, and it is worth writing down why.

## One GCN layer on the LOR–pixel graph

A GCN layer updates node features $$\mathbf{H}$$ as

$$
\mathbf{H}' = \sigma\!\left(\hat{\mathbf{D}}^{-1/2}\, \hat{\mathbf{A}}\, \hat{\mathbf{D}}^{-1/2}\, \mathbf{H}\, \boldsymbol{\Theta}\right),
$$

where $$\hat{\mathbf{A}}$$ is the weighted adjacency matrix (with self-loops), $$\hat{\mathbf{D}}$$ its diagonal degree matrix and $$\boldsymbol{\Theta}$$ the only trainable weights.

Each node carries one number: the measured counts $$y_i$$ on LOR nodes and zero on pixel nodes.
The weights then reduce to an input map $$\varphi_1 \in \mathbb{R}^{1 \times F}$$ and an output map $$\varphi_2 \in \mathbb{R}^{F \times 1}$$, and only their product enters the layer.
**$$\varphi_1 \varphi_2 = c$$ is a scalar.**

In the repository the edges point from LOR nodes to pixel nodes. With the standard `GCNConv` normalization of PyTorch Geometric, which adds self-loops and computes degrees on the receiving side,
an LOR node has degree 1 (its self-loop) and pixel $$j$$ has degree $$1 + s_j$$, where $$s_j = \sum_i a_{ij}$$ is its sensitivity.
Reading off the pixel rows (pixels have no pixel neighbours, and their own self-loop multiplies a zero feature):

$$
x_j = \sigma\!\left( \frac{c}{\sqrt{1 + s_j}} \sum_i a_{ij}\, y_i \right),
\qquad\text{i.e.}\qquad
\mathbf{x} = \sigma\!\left( c\, (\mathbf{I} + \mathbf{S})^{-1/2} \mathbf{A}^{\top} \mathbf{y} \right).
$$

Up to one learned scale $$c$$ and the activation, the layer is a **backprojection** $$\mathbf{A}^{\top}\mathbf{y}$$ with each pixel divided by the square root of its sensitivity.
If the edges were made undirected, the LOR degrees would become $$1 + \ell_i$$, with $$\ell_i = \sum_j a_{ij}$$ the length of LOR $$i$$ through the image, and each LOR would also be divided by $$\sqrt{1 + \ell_i}$$.
Either way, nothing about the geometry is learned: the operator is fixed by the system matrix, and the network can only rescale it.

## How it relates to MLEM

Starting MLEM from a uniform image $$\mathbf{x}^{(0)} = \mathbf{1}$$, the first iterate is

$$
x^{(1)}_j = \frac{1}{s_j} \sum_i a_{ij}\, \frac{y_i}{\ell_i},
\qquad s_j = \sum_i a_{ij},\quad \ell_i = \sum_j a_{ij},
$$

the same backprojection with full normalization by sensitivity (and by LOR length) instead of square roots.
The GCN layer is therefore a cruder cousin of one MLEM step from a flat image.

## What this means for TomoGNN

The good results of TomoGNN come from the two CNNs around this layer: a sinogram denoiser and an image-domain refiner on top of a normalized backprojection.
That is a sensible pipeline, close to "denoise, backproject, post-process", but the graph layer itself adds no learned reconstruction.
A learned operator would need richer node features or edge weights that are predicted rather than copied from the system matrix, which is the direction I later took for positron-range modeling (see [One Linear Layer]({{ '/publications/' | relative_url }}#one-linear-layer)).

The [repository](https://github.com/Mellak/TomoGNN) is archived and kept for reference.

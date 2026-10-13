---
author: Lori
pubDatetime: 2025-08-02T09:26:46.569Z
modDatetime:
title: Memory Locality, Optimize Your Go Code
slug: memory-locality-go
featured: true
draft: false
tags:
  - low-level
  - system
  - go
description:
  What's the different when you see Go code using []*structs or []structs? Choosing which approach and understand what happen behind that code is important when you want to write high performance code.
---

Also known as **principle of locality of reference,** is fundamental concept in computer science that explains how programs tend to access memory in predictable patterns.

So, when the CPU try to access data from the main memory, it will get a chunk (block or cache line) sequence of data from it and put it in CPU cache, if data sequential it allows CPU to perform faster due to the cache hit, else it will experience many **cache miss.**

## Memory Hierarchy

The reason memory locality is critical is due to the **memory hierarchy** in modern computers:

- **Registers:** Fastest, smallest,  directly in CPU.
- **L1 Cache:** Very fast, small, per-CPU core.
- **L2 Cache:** Fast, larger, per-CPU core or shared per-chip
- **L3 Cache:** Slower, largest, shared across CPU cores.
- **Main Memory (RAM):** Much slower, very large.
- **Disk (SSD/HDD):** Extremely slow, enormous capacity.

## Implementation

### Slice of Pointers to Structs

We found a lot of code implementation in Go that a function returning `[]*structs` (slice of pointers to structs) or the way they store the data in that manner. Which this practice slowing down the program due to the many cache miss.

By using that approach, the Go runtime allocates a contiguous block of memory for the pointers themselves. Each struct that these pointers refer is to allocated separately on the heap, at potentially random, non-contiguous locations.

Example:

```go

type User struct {
	ID   int
	Name string
}

pointersToStructs := make([]*User, 100)

for i := range pointersToStructs {
	pointersToStructs[i] = &User{}
}
```

That code will have contiguous block of pointers

`Slice: [*ptr1][*ptr2][*ptr3]...[*ptr100]`

While the structs itself that the pointer point to are at the random heap address.

**Cache Miss**

When we try to iterate that `pointersToStructs`  and access the property `pointersToStructs[i].ID` , the CPU will load the pointer which in the contiguous slice, then it performs the second memory access to dereference the pointer and fetch actual struct data from non-contiguous location on the heap. This is results **cache miss,** where the CPU has to go all the way to the main memory.

Due to the non-contiguous location of the struct, the CPU prefetcher can’t effectively prefetch actual struct data because it doesn’t know where the next struct located in memory.

Instead of doing that, we can just store in slice of structs.

### Slice of Structs

With `[]structs` the Go runtime will allocates a contiguous block of memory for all the struct instances. Example:

```go
type User struct {
	ID   int
	Name string
}

pointersToStructs := make([]User, 100)
```

Above code will have this memory layout

`[User1][User2]...[User100]`

Using this approach allows the CPU’s cache line not just load `pointersToStructs[0]` but also the next struct, this because `User` struct instances are adjacent in memory.

It will also utilize CPU prefetcher effectively and ability to predict the next data when we iterate the slice, instead of going to the main memory for each item, it will load the block of the memory and improving the cache hit.

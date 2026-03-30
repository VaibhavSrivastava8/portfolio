"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

interface Props {
  title: string;
  href?: string;
  description: string;
  tags: readonly string[];
  link?: string;
  image?: string;
  video?: string;
  className?: string;
}

export function ProjectCard({
  title,
  href,
  description,
  tags,
  link,
  image,
  className,
}: Props) {
  return (
    <motion.div
      whileHover={{
        scale: 1.02,
        rotateX: 1,
        rotateY: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      style={{ perspective: 1000 }}
      className="h-full"
    >
      <Card
        className={cn(
          "flex flex-col overflow-hidden border hover:shadow-lg transition-all duration-300 ease-out h-full",
          "hover:shadow-[0_8px_30px_hsl(var(--ring)/0.12)] hover:border-[hsl(var(--ring)/0.3)]",
          "animate-border-glow"
        )}
      >
        <Link
          href={href || "#"}
          className={cn("block cursor-pointer relative group", className)}
        >
          {image && (
            <div className="relative overflow-hidden">
              <Image
                src={image}
                alt={title}
                width={500}
                height={300}
                className="h-40 w-full overflow-hidden object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}
        </Link>
        <CardHeader className="px-2">
          <div className="space-y-1">
            <CardTitle className="mt-1 text-base">{title}</CardTitle>
            <div className="hidden font-sans text-xs underline print:visible">
              {link
                ?.replace("https://", "")
                .replace("www.", "")
                .replace("/", "")}
            </div>
            <Markdown className="prose max-w-full text-pretty font-sans text-xs text-muted-foreground dark:prose-invert">
              {description}
            </Markdown>
          </div>
        </CardHeader>
        <CardContent className="mt-auto flex flex-col px-2">
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags?.map((tag, index) => (
                <motion.div
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                >
                  <Badge
                    className="px-1 py-0 text-[10px] transition-all duration-200 hover:scale-105"
                    variant="secondary"
                  >
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="px-2 pb-2">
          {link && (
            <div className="flex flex-row flex-wrap items-start gap-1">
              <Link href={link} key={link} target="_blank">
                <Badge
                  key={link}
                  className="flex gap-2 px-2 py-1 text-[10px]"
                >
                  {title}
                </Badge>
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}
